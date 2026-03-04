
-- ============================================================
-- FIX: Recriar TODAS as políticas RLS como PERMISSIVE
-- ============================================================

-- ==================== CLIENTS ====================
DROP POLICY IF EXISTS "Workspace members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can delete clients" ON public.clients;

CREATE POLICY "Workspace members can view clients" ON public.clients FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update clients" ON public.clients FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete clients" ON public.clients FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== BUDGETS ====================
DROP POLICY IF EXISTS "Workspace members can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can delete budgets" ON public.budgets;

CREATE POLICY "Workspace members can view budgets" ON public.budgets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update budgets" ON public.budgets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete budgets" ON public.budgets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== BUDGET_VERSIONS ====================
DROP POLICY IF EXISTS "Workspace members can view budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can insert budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can update budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can delete budget_versions" ON public.budget_versions;

CREATE POLICY "Workspace members can view budget_versions" ON public.budget_versions FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert budget_versions" ON public.budget_versions FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update budget_versions" ON public.budget_versions FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete budget_versions" ON public.budget_versions FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== PROSPECTION_LEADS ====================
DROP POLICY IF EXISTS "Workspace members can view leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can insert leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can update leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can delete leads" ON public.prospection_leads;

CREATE POLICY "Workspace members can view leads" ON public.prospection_leads FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert leads" ON public.prospection_leads FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update leads" ON public.prospection_leads FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete leads" ON public.prospection_leads FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== ASSETS ====================
DROP POLICY IF EXISTS "Workspace members can view assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can update assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can delete assets" ON public.assets;

CREATE POLICY "Workspace members can view assets" ON public.assets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update assets" ON public.assets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete assets" ON public.assets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== HARD_DRIVES ====================
DROP POLICY IF EXISTS "Workspace members can view hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can insert hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can update hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can delete hard_drives" ON public.hard_drives;

CREATE POLICY "Workspace members can view hard_drives" ON public.hard_drives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert hard_drives" ON public.hard_drives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update hard_drives" ON public.hard_drives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete hard_drives" ON public.hard_drives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== LEGACY_PROJECTS ====================
DROP POLICY IF EXISTS "Workspace members can view legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can insert legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can update legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can delete legacy_projects" ON public.legacy_projects;

CREATE POLICY "Workspace members can view legacy_projects" ON public.legacy_projects FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert legacy_projects" ON public.legacy_projects FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update legacy_projects" ON public.legacy_projects FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete legacy_projects" ON public.legacy_projects FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== KANBAN_COLUMNS ====================
DROP POLICY IF EXISTS "Workspace members can view kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can insert kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can update kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can delete kanban_columns" ON public.kanban_columns;

CREATE POLICY "Workspace members can view kanban_columns" ON public.kanban_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert kanban_columns" ON public.kanban_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update kanban_columns" ON public.kanban_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete kanban_columns" ON public.kanban_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== PROJECT_CARDS ====================
DROP POLICY IF EXISTS "Workspace members can view project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can insert project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can update project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can delete project_cards" ON public.project_cards;

CREATE POLICY "Workspace members can view project_cards" ON public.project_cards FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert project_cards" ON public.project_cards FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update project_cards" ON public.project_cards FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete project_cards" ON public.project_cards FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== PROJECT_COLUMNS ====================
DROP POLICY IF EXISTS "Workspace members can view project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can insert project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can update project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can delete project_columns" ON public.project_columns;

CREATE POLICY "Workspace members can view project_columns" ON public.project_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert project_columns" ON public.project_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update project_columns" ON public.project_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete project_columns" ON public.project_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== SCORE_HISTORY ====================
DROP POLICY IF EXISTS "Workspace members can view score_history" ON public.score_history;
DROP POLICY IF EXISTS "Workspace members can insert score_history" ON public.score_history;
DROP POLICY IF EXISTS "Workspace members can delete score_history" ON public.score_history;

CREATE POLICY "Workspace members can view score_history" ON public.score_history FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert score_history" ON public.score_history FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete score_history" ON public.score_history FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== SERVICE_CATEGORIES ====================
DROP POLICY IF EXISTS "Workspace members can view service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can insert service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can update service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can delete service_categories" ON public.service_categories;

CREATE POLICY "Workspace members can view service_categories" ON public.service_categories FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert service_categories" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update service_categories" ON public.service_categories FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete service_categories" ON public.service_categories FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== SERVICE_OBJECTIVES ====================
DROP POLICY IF EXISTS "Workspace members can view service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can insert service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can update service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can delete service_objectives" ON public.service_objectives;

CREATE POLICY "Workspace members can view service_objectives" ON public.service_objectives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert service_objectives" ON public.service_objectives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update service_objectives" ON public.service_objectives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete service_objectives" ON public.service_objectives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- ==================== WORKSPACE_INVITES ====================
DROP POLICY IF EXISTS "Members can view invites for their workspace" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can create invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can update invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can delete invites" ON public.workspace_invites;

CREATE POLICY "Members can view invites for their workspace" ON public.workspace_invites FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Owner/admin can create invites" ON public.workspace_invites FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner/admin can update invites" ON public.workspace_invites FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner/admin can delete invites" ON public.workspace_invites FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));

-- ==================== WORKSPACE_MEMBERS ====================
DROP POLICY IF EXISTS "Members can view their workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can insert members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can delete members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert themselves as owner" ON public.workspace_members;

CREATE POLICY "Members can view their workspace members" ON public.workspace_members FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "Owner/admin can insert members" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner/admin can update members" ON public.workspace_members FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Owner/admin can delete members" ON public.workspace_members FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "Users can insert themselves as owner" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- ==================== WORKSPACES ====================
DROP POLICY IF EXISTS "Users can view their workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owner can update workspace" ON public.workspaces;

CREATE POLICY "Users can view their workspace" ON public.workspaces FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), id));
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner can update workspace" ON public.workspaces FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), id));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Workspace members can view peer profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Workspace members can view peer profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  )
);
