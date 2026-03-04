
-- =============================================
-- DROP ALL EXISTING POLICIES ON ALL TABLES
-- =============================================

-- clients
DROP POLICY IF EXISTS "Workspace members can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can update clients" ON public.clients;
DROP POLICY IF EXISTS "Workspace members can view clients" ON public.clients;

-- budgets
DROP POLICY IF EXISTS "Workspace members can delete budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Workspace members can view budgets" ON public.budgets;

-- budget_versions
DROP POLICY IF EXISTS "Workspace members can delete budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can insert budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can update budget_versions" ON public.budget_versions;
DROP POLICY IF EXISTS "Workspace members can view budget_versions" ON public.budget_versions;

-- prospection_leads
DROP POLICY IF EXISTS "Workspace members can delete leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can insert leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can update leads" ON public.prospection_leads;
DROP POLICY IF EXISTS "Workspace members can view leads" ON public.prospection_leads;

-- assets
DROP POLICY IF EXISTS "Workspace members can delete assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can update assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can view assets" ON public.assets;

-- hard_drives
DROP POLICY IF EXISTS "Workspace members can delete hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can insert hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can update hard_drives" ON public.hard_drives;
DROP POLICY IF EXISTS "Workspace members can view hard_drives" ON public.hard_drives;

-- legacy_projects
DROP POLICY IF EXISTS "Workspace members can delete legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can insert legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can update legacy_projects" ON public.legacy_projects;
DROP POLICY IF EXISTS "Workspace members can view legacy_projects" ON public.legacy_projects;

-- kanban_columns
DROP POLICY IF EXISTS "Workspace members can delete kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can insert kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can update kanban_columns" ON public.kanban_columns;
DROP POLICY IF EXISTS "Workspace members can view kanban_columns" ON public.kanban_columns;

-- project_cards
DROP POLICY IF EXISTS "Workspace members can delete project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can insert project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can update project_cards" ON public.project_cards;
DROP POLICY IF EXISTS "Workspace members can view project_cards" ON public.project_cards;

-- project_columns
DROP POLICY IF EXISTS "Workspace members can delete project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can insert project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can update project_columns" ON public.project_columns;
DROP POLICY IF EXISTS "Workspace members can view project_columns" ON public.project_columns;

-- score_history
DROP POLICY IF EXISTS "Workspace members can delete score_history" ON public.score_history;
DROP POLICY IF EXISTS "Workspace members can insert score_history" ON public.score_history;
DROP POLICY IF EXISTS "Workspace members can view score_history" ON public.score_history;

-- service_categories
DROP POLICY IF EXISTS "Workspace members can delete service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can insert service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can update service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Workspace members can view service_categories" ON public.service_categories;

-- service_objectives
DROP POLICY IF EXISTS "Workspace members can delete service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can insert service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can update service_objectives" ON public.service_objectives;
DROP POLICY IF EXISTS "Workspace members can view service_objectives" ON public.service_objectives;

-- workspace_invites
DROP POLICY IF EXISTS "Members can view invites for their workspace" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can create invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can delete invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Owner/admin can update invites" ON public.workspace_invites;

-- workspace_members
DROP POLICY IF EXISTS "Members can view their workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can delete members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can insert members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owner/admin can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert themselves as owner" ON public.workspace_members;

-- workspaces
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owner can update workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their workspace" ON public.workspaces;

-- profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Workspace members can view peer profiles" ON public.profiles;

-- =============================================
-- RECREATE ALL POLICIES AS PERMISSIVE (default)
-- =============================================

-- clients
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- budgets
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- budget_versions
CREATE POLICY "budget_versions_select" ON public.budget_versions FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_insert" ON public.budget_versions FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_update" ON public.budget_versions FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_delete" ON public.budget_versions FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- prospection_leads
CREATE POLICY "leads_select" ON public.prospection_leads FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_insert" ON public.prospection_leads FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_update" ON public.prospection_leads FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_delete" ON public.prospection_leads FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- assets
CREATE POLICY "assets_select" ON public.assets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_insert" ON public.assets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_update" ON public.assets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_delete" ON public.assets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- hard_drives
CREATE POLICY "hard_drives_select" ON public.hard_drives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_insert" ON public.hard_drives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_update" ON public.hard_drives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_delete" ON public.hard_drives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- legacy_projects
CREATE POLICY "legacy_projects_select" ON public.legacy_projects FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_insert" ON public.legacy_projects FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_update" ON public.legacy_projects FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_delete" ON public.legacy_projects FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- kanban_columns
CREATE POLICY "kanban_columns_select" ON public.kanban_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_insert" ON public.kanban_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_update" ON public.kanban_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_delete" ON public.kanban_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- project_cards
CREATE POLICY "project_cards_select" ON public.project_cards FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_insert" ON public.project_cards FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_update" ON public.project_cards FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_delete" ON public.project_cards FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- project_columns
CREATE POLICY "project_columns_select" ON public.project_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_insert" ON public.project_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_update" ON public.project_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_delete" ON public.project_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- score_history
CREATE POLICY "score_history_select" ON public.score_history FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "score_history_insert" ON public.score_history FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "score_history_delete" ON public.score_history FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- service_categories
CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_delete" ON public.service_categories FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- service_objectives
CREATE POLICY "service_objectives_select" ON public.service_objectives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_insert" ON public.service_objectives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_update" ON public.service_objectives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_delete" ON public.service_objectives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- workspace_invites
CREATE POLICY "workspace_invites_select" ON public.workspace_invites FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "workspace_invites_insert" ON public.workspace_invites FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_invites_update" ON public.workspace_invites FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_invites_delete" ON public.workspace_invites FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));

-- workspace_members
CREATE POLICY "workspace_members_select" ON public.workspace_members FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "workspace_members_insert_owner" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id AND role = 'owner'));
CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_members_update" ON public.workspace_members FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_members_delete" ON public.workspace_members FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));

-- workspaces
CREATE POLICY "workspaces_select" ON public.workspaces FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), id));
CREATE POLICY "workspaces_insert" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "workspaces_update" ON public.workspaces FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), id));

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_peers" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm1 JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
