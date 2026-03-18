
-- Drop the admin insert policy (only owner should manage members)
DROP POLICY IF EXISTS "workspace_members_insert_admin" ON public.workspace_members;

-- Update delete policy: owner only
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
CREATE POLICY "workspace_members_delete" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) = 'owner'::app_role);

-- Update update policy: owner only
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
CREATE POLICY "workspace_members_update" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) = 'owner'::app_role);
