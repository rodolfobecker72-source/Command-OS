
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for budgets
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;

CREATE POLICY "budgets_select" ON public.budgets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- budget_versions
DROP POLICY IF EXISTS "budget_versions_select" ON public.budget_versions;
DROP POLICY IF EXISTS "budget_versions_insert" ON public.budget_versions;
DROP POLICY IF EXISTS "budget_versions_update" ON public.budget_versions;
DROP POLICY IF EXISTS "budget_versions_delete" ON public.budget_versions;

CREATE POLICY "budget_versions_select" ON public.budget_versions FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_insert" ON public.budget_versions FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_update" ON public.budget_versions FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "budget_versions_delete" ON public.budget_versions FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- assets
DROP POLICY IF EXISTS "assets_select" ON public.assets;
DROP POLICY IF EXISTS "assets_insert" ON public.assets;
DROP POLICY IF EXISTS "assets_update" ON public.assets;
DROP POLICY IF EXISTS "assets_delete" ON public.assets;

CREATE POLICY "assets_select" ON public.assets FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_insert" ON public.assets FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_update" ON public.assets FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "assets_delete" ON public.assets FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- hard_drives
DROP POLICY IF EXISTS "hard_drives_select" ON public.hard_drives;
DROP POLICY IF EXISTS "hard_drives_insert" ON public.hard_drives;
DROP POLICY IF EXISTS "hard_drives_update" ON public.hard_drives;
DROP POLICY IF EXISTS "hard_drives_delete" ON public.hard_drives;

CREATE POLICY "hard_drives_select" ON public.hard_drives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_insert" ON public.hard_drives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_update" ON public.hard_drives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "hard_drives_delete" ON public.hard_drives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- kanban_columns
DROP POLICY IF EXISTS "kanban_columns_select" ON public.kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_insert" ON public.kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_update" ON public.kanban_columns;
DROP POLICY IF EXISTS "kanban_columns_delete" ON public.kanban_columns;

CREATE POLICY "kanban_columns_select" ON public.kanban_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_insert" ON public.kanban_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_update" ON public.kanban_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "kanban_columns_delete" ON public.kanban_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- legacy_projects
DROP POLICY IF EXISTS "legacy_projects_select" ON public.legacy_projects;
DROP POLICY IF EXISTS "legacy_projects_insert" ON public.legacy_projects;
DROP POLICY IF EXISTS "legacy_projects_update" ON public.legacy_projects;
DROP POLICY IF EXISTS "legacy_projects_delete" ON public.legacy_projects;

CREATE POLICY "legacy_projects_select" ON public.legacy_projects FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_insert" ON public.legacy_projects FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_update" ON public.legacy_projects FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "legacy_projects_delete" ON public.legacy_projects FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- project_cards
DROP POLICY IF EXISTS "project_cards_select" ON public.project_cards;
DROP POLICY IF EXISTS "project_cards_insert" ON public.project_cards;
DROP POLICY IF EXISTS "project_cards_update" ON public.project_cards;
DROP POLICY IF EXISTS "project_cards_delete" ON public.project_cards;

CREATE POLICY "project_cards_select" ON public.project_cards FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_insert" ON public.project_cards FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_update" ON public.project_cards FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_cards_delete" ON public.project_cards FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- project_columns
DROP POLICY IF EXISTS "project_columns_select" ON public.project_columns;
DROP POLICY IF EXISTS "project_columns_insert" ON public.project_columns;
DROP POLICY IF EXISTS "project_columns_update" ON public.project_columns;
DROP POLICY IF EXISTS "project_columns_delete" ON public.project_columns;

CREATE POLICY "project_columns_select" ON public.project_columns FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_insert" ON public.project_columns FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_update" ON public.project_columns FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "project_columns_delete" ON public.project_columns FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- prospection_leads
DROP POLICY IF EXISTS "leads_select" ON public.prospection_leads;
DROP POLICY IF EXISTS "leads_insert" ON public.prospection_leads;
DROP POLICY IF EXISTS "leads_update" ON public.prospection_leads;
DROP POLICY IF EXISTS "leads_delete" ON public.prospection_leads;

CREATE POLICY "leads_select" ON public.prospection_leads FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_insert" ON public.prospection_leads FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_update" ON public.prospection_leads FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "leads_delete" ON public.prospection_leads FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- score_history
DROP POLICY IF EXISTS "score_history_select" ON public.score_history;
DROP POLICY IF EXISTS "score_history_insert" ON public.score_history;
DROP POLICY IF EXISTS "score_history_delete" ON public.score_history;

CREATE POLICY "score_history_select" ON public.score_history FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "score_history_insert" ON public.score_history FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "score_history_delete" ON public.score_history FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- service_categories
DROP POLICY IF EXISTS "service_categories_select" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_insert" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_update" ON public.service_categories;
DROP POLICY IF EXISTS "service_categories_delete" ON public.service_categories;

CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_categories_delete" ON public.service_categories FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- service_objectives
DROP POLICY IF EXISTS "service_objectives_select" ON public.service_objectives;
DROP POLICY IF EXISTS "service_objectives_insert" ON public.service_objectives;
DROP POLICY IF EXISTS "service_objectives_update" ON public.service_objectives;
DROP POLICY IF EXISTS "service_objectives_delete" ON public.service_objectives;

CREATE POLICY "service_objectives_select" ON public.service_objectives FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_insert" ON public.service_objectives FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_update" ON public.service_objectives FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "service_objectives_delete" ON public.service_objectives FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));

-- workspace_invites (keep admin-only for write ops)
DROP POLICY IF EXISTS "workspace_invites_select" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_insert" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_update" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_delete" ON public.workspace_invites;

CREATE POLICY "workspace_invites_select" ON public.workspace_invites FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "workspace_invites_insert" ON public.workspace_invites FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_invites_update" ON public.workspace_invites FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_invites_delete" ON public.workspace_invites FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));

-- workspace_members (keep admin-only for write ops, except owner self-insert)
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_admin" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_owner" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;

CREATE POLICY "workspace_members_select" ON public.workspace_members FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), workspace_id));
CREATE POLICY "workspace_members_insert_admin" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_members_insert_owner" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = 'owner');
CREATE POLICY "workspace_members_update" ON public.workspace_members FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));
CREATE POLICY "workspace_members_delete" ON public.workspace_members FOR DELETE TO authenticated USING (has_workspace_access(auth.uid(), workspace_id) AND get_user_role(auth.uid()) IN ('owner', 'admin'));

-- workspaces
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;

CREATE POLICY "workspaces_select" ON public.workspaces FOR SELECT TO authenticated USING (has_workspace_access(auth.uid(), id));
CREATE POLICY "workspaces_insert" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "workspaces_update" ON public.workspaces FOR UPDATE TO authenticated USING (has_workspace_access(auth.uid(), id));

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_peers" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_peers" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workspace_members wm1 JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
