
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'vendedor', 'visualizador');

-- 2. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 4. Workspace Members
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 5. Workspace Invites
CREATE TABLE public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  page_permissions TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- 6. Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id LIMIT 1
$$;

-- 7. RLS policies for workspaces
CREATE POLICY "Users can view their workspace"
  ON public.workspaces FOR SELECT
  USING (public.has_workspace_access(auth.uid(), id));

CREATE POLICY "Owner can update workspace"
  ON public.workspaces FOR UPDATE
  USING (public.has_workspace_access(auth.uid(), id));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 8. RLS policies for workspace_members
CREATE POLICY "Members can view their workspace members"
  ON public.workspace_members FOR SELECT
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Owner/admin can insert members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

CREATE POLICY "Owner/admin can update members"
  ON public.workspace_members FOR UPDATE
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

CREATE POLICY "Owner/admin can delete members"
  ON public.workspace_members FOR DELETE
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

-- Special: allow a user to insert themselves as owner (during signup)
CREATE POLICY "Users can insert themselves as owner"
  ON public.workspace_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- 9. RLS policies for workspace_invites
CREATE POLICY "Members can view invites for their workspace"
  ON public.workspace_invites FOR SELECT
  USING (public.has_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Owner/admin can create invites"
  ON public.workspace_invites FOR INSERT
  WITH CHECK (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

CREATE POLICY "Owner/admin can update invites"
  ON public.workspace_invites FOR UPDATE
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

CREATE POLICY "Owner/admin can delete invites"
  ON public.workspace_invites FOR DELETE
  USING (
    public.has_workspace_access(auth.uid(), workspace_id)
    AND (public.get_user_role(auth.uid()) IN ('owner', 'admin'))
  );

-- 10. Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Function to handle signup: create workspace + add as owner
CREATE OR REPLACE FUNCTION public.handle_signup_workspace(workspace_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO public.workspaces (name, created_by)
  VALUES (workspace_name, auth.uid())
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, auth.uid(), 'owner');

  RETURN new_workspace_id;
END;
$$;

-- 12. Function to accept invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.workspace_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.workspace_invites WHERE id = invite_id AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already accepted';
  END IF;

  -- Check email matches
  IF v_invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Email does not match invite';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, page_permissions)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role, v_invite.page_permissions);

  UPDATE public.workspace_invites SET accepted_at = now() WHERE id = invite_id;
END;
$$;
