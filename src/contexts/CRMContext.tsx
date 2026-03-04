import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Client,
  Budget,
  BudgetVersion,
  CostItem,
  CRMCard,
  CRMStatus,
  LeadOrigin,
  ServiceType,
  ProjectExecution,
  ServiceItem,
  ExecutionServiceItem,
  ExecutionCostItem,
  DeliveryLink,
  KanbanColumn,
  DEFAULT_KANBAN_COLUMNS,
  ServiceCategory,
  ServiceObjective,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_SERVICE_OBJECTIVES,
  HardDrive,
  HDProjectAllocation,
  LegacyProject,
  Asset,
  ProjectColumn,
  ProjectCard,
  DEFAULT_PROJECT_COLUMNS,
  calculateServiceTotals,
} from '@/types/crm';
import { calculateClientScore, ScoreBreakdown } from '@/utils/clientScore';
import type { ScoreHistoryEntry } from '@/components/client/ScoreHistory';

// ============= snake_case <-> camelCase helpers =============

function clientFromDb(row: any): Client {
  return {
    id: row.id,
    companyName: row.company_name,
    cnpj: row.cnpj,
    responsiblePerson: row.responsible_person,
    email: row.email,
    phone: row.phone,
    leadOrigin: row.lead_origin as LeadOrigin,
    score: row.score,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function clientToDb(c: Partial<Client>, workspaceId?: string): any {
  const row: any = {};
  if (workspaceId) row.workspace_id = workspaceId;
  if (c.companyName !== undefined) row.company_name = c.companyName;
  if (c.cnpj !== undefined) row.cnpj = c.cnpj;
  if (c.responsiblePerson !== undefined) row.responsible_person = c.responsiblePerson;
  if (c.email !== undefined) row.email = c.email;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.leadOrigin !== undefined) row.lead_origin = c.leadOrigin;
  if (c.score !== undefined) row.score = c.score;
  return row;
}

function kanbanColumnFromDb(row: any): KanbanColumn {
  return { id: row.id, key: row.key, label: row.label, color: row.color, order: row.order, isDefault: row.is_default };
}

function serviceCategoryFromDb(row: any): ServiceCategory {
  return { id: row.id, key: row.key, label: row.label, order: row.order, isDefault: row.is_default };
}

function serviceObjectiveFromDb(row: any): ServiceObjective {
  return { id: row.id, categoryKey: row.category_key, key: row.key, label: row.label, order: row.order };
}

function projectColumnFromDb(row: any): ProjectColumn {
  return { id: row.id, key: row.key, label: row.label, color: row.color, order: row.order, isDefault: row.is_default };
}

function budgetFromDb(row: any, versions: BudgetVersion[]): Budget {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    projectName: row.project_name,
    projectDescription: row.project_description,
    clientId: row.client_id,
    serviceType: row.service_type,
    objective: row.objective,
    description: row.description,
    paymentTerms: row.payment_terms,
    includesTax: row.includes_tax,
    includesLogistics: row.includes_logistics,
    includesAccommodation: row.includes_accommodation,
    includesMeals: row.includes_meals,
    includesRawMaterial: row.includes_raw_material,
    includesTechnicalVisit: row.includes_technical_visit,
    hasExecutionDate: row.has_execution_date,
    executionStartDate: row.execution_start_date ? new Date(row.execution_start_date) : null,
    executionEndDate: row.execution_end_date ? new Date(row.execution_end_date) : null,
    location: row.location,
    status: row.status,
    versions,
    currentVersion: row.current_version,
    approvedVersion: row.approved_version,
    approvalDate: row.approval_date ? new Date(row.approval_date) : null,
    finalValue: row.final_value,
    contractUrl: row.contract_url,
    nfUrl: row.nf_url,
    execution: row.execution as ProjectExecution | null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function budgetVersionFromDb(row: any): BudgetVersion {
  return {
    id: row.id,
    budgetId: row.budget_id,
    version: row.version,
    services: (row.services || []) as ServiceItem[],
    operationalCosts: (row.operational_costs || []) as CostItem[],
    costs: (row.costs || []) as CostItem[],
    productionCost: Number(row.production_cost),
    fixedCostPercentage: Number(row.fixed_cost_percentage),
    nfCostPercentage: Number(row.nf_cost_percentage),
    totalCost: Number(row.total_cost),
    fullPrice: Number(row.full_price),
    discount4Price: Number(row.discount4_price),
    discount5Price: Number(row.discount5_price),
    margin: Number(row.margin),
    reason: row.reason,
    isRejected: row.is_rejected,
    rejectionReason: row.rejection_reason,
    createdAt: new Date(row.created_at),
  };
}

function assetFromDb(row: any): Asset {
  return {
    id: row.id, name: row.name, description: row.description, value: Number(row.value),
    serialNumber: row.serial_number, heroAssetNumber: row.hero_asset_number, photo: row.photo,
    referenceLink: row.reference_link, assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
  };
}

function hardDriveFromDb(row: any): HardDrive {
  return {
    id: row.id, label: row.label, capacityGB: Number(row.capacity_gb),
    projects: (row.projects || []) as HDProjectAllocation[],
    createdAt: new Date(row.created_at),
  };
}

function legacyProjectFromDb(row: any): LegacyProject {
  return {
    id: row.id, projectNumber: row.project_number, clientId: row.client_id,
    clientName: row.client_name, sizeGB: Number(row.size_gb), createdAt: new Date(row.created_at),
  };
}

function scoreHistoryFromDb(row: any): ScoreHistoryEntry {
  return {
    id: row.id, score: row.score, previousScore: row.previous_score,
    reason: row.reason, timestamp: new Date(row.created_at),
  };
}

function projectCardFromDb(row: any): ProjectCard {
  return {
    id: row.id, budgetId: row.budget_id, proposalId: row.proposal_id,
    projectName: row.project_name, clientName: row.client_name, clientId: row.client_id,
    serviceTypes: (row.service_types || []) as ServiceType[],
    objective: row.objective, status: row.status, progress: row.progress,
    tasks: (row.tasks || []) as any[], links: (row.links || []) as any[],
    comments: (row.comments || []) as any[], materialLink: row.material_link,
    startDate: row.start_date ? new Date(row.start_date) : null,
    endDate: row.end_date ? new Date(row.end_date) : null,
    notes: row.notes, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
  };
}

// ============= Context type =============

interface CRMContextType {
  isLoading: boolean;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  getClientScoreBreakdown: (clientId: string) => ScoreBreakdown;

  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>) => Promise<Budget | null>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  updateBudgetStatus: (id: string, status: CRMStatus) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudget: (id: string) => Budget | undefined;

  addBudgetVersion: (budgetId: string, version: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => Promise<void>;
  updateBudgetVersion: (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => Promise<void>;
  approveBudget: (budgetId: string, versionNumber: number) => Promise<void>;

  updateExecution: (budgetId: string, execution: Partial<ProjectExecution>) => void;
  updateExecutionCost: (budgetId: string, serviceId: string, costId: string, updates: Partial<ExecutionCostItem>, isExtraCost?: boolean) => void;
  addExtraCost: (budgetId: string, serviceId: string, cost: Omit<ExecutionCostItem, 'id' | 'budgetedValue'>) => void;
  removeExtraCost: (budgetId: string, serviceId: string, costId: string) => void;
  finalizeExecution: (budgetId: string, finalReport?: string) => void;
  addDeliveryLink: (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => void;
  removeDeliveryLink: (budgetId: string, linkId: string) => void;

  kanbanColumns: KanbanColumn[];
  addKanbanColumn: (column: Omit<KanbanColumn, 'id' | 'order'>) => Promise<void>;
  updateKanbanColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteKanbanColumn: (id: string) => Promise<void>;
  reorderKanbanColumns: (columns: KanbanColumn[]) => Promise<void>;
  getStatusLabel: (status: CRMStatus) => string;

  serviceCategories: ServiceCategory[];
  serviceObjectives: ServiceObjective[];
  addServiceCategory: (category: Omit<ServiceCategory, 'id' | 'order'>) => Promise<void>;
  updateServiceCategory: (id: string, updates: Partial<ServiceCategory>) => Promise<void>;
  deleteServiceCategory: (id: string) => Promise<void>;
  addServiceObjective: (objective: Omit<ServiceObjective, 'id' | 'order'>) => Promise<void>;
  updateServiceObjective: (id: string, updates: Partial<ServiceObjective>) => Promise<void>;
  deleteServiceObjective: (id: string) => Promise<void>;
  getObjectivesForCategory: (categoryKey: string) => { value: string; label: string }[];
  getCategoryLabel: (key: string) => string;

  hardDrives: HardDrive[];
  addHardDrive: (hd: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => Promise<void>;
  updateHardDrive: (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => Promise<void>;
  deleteHardDrive: (id: string) => Promise<void>;
  allocateProjectToHD: (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => Promise<void>;
  removeProjectFromHD: (hdId: string, allocationId: string) => Promise<void>;

  legacyProjects: LegacyProject[];
  addLegacyProject: (project: Omit<LegacyProject, 'id' | 'createdAt'>) => Promise<LegacyProject | null>;
  deleteLegacyProject: (id: string) => Promise<void>;
  getLegacyProject: (id: string) => LegacyProject | undefined;
  getHDForBudget: (budgetId: string) => { hdLabel: string; hdId: string } | null;

  scoreHistory: ScoreHistoryEntry[];
  getClientScoreHistory: (clientId: string) => ScoreHistoryEntry[];

  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Asset | null>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  projectCards: ProjectCard[];
  projectColumns: ProjectColumn[];
  updateProjectCard: (id: string, updates: Partial<ProjectCard>) => Promise<void>;
  addProjectColumn: (column: Omit<ProjectColumn, 'id' | 'order'>) => Promise<void>;
  updateProjectColumn: (id: string, updates: Partial<ProjectColumn>) => Promise<void>;
  deleteProjectColumn: (id: string) => Promise<void>;

  getCRMCards: () => CRMCard[];
  getCardsByStatus: (status: CRMStatus) => CRMCard[];
  moveCard: (cardId: string, newStatus: CRMStatus) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const { workspace, isLoading: authLoading } = useAuth();
  const workspaceId = workspace?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceObjectives, setServiceObjectives] = useState<ServiceObjective[]>([]);
  const [hardDrives, setHardDrives] = useState<HardDrive[]>([]);
  const [legacyProjects, setLegacyProjects] = useState<LegacyProject[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projectCards, setProjectCards] = useState<ProjectCard[]>([]);
  const [projectColumns, setProjectColumns] = useState<ProjectColumn[]>([]);

  // ============= Load all data from DB =============
  useEffect(() => {
    if (!workspaceId) {
      // Only set isLoading=false if auth has finished loading (no workspace means user has none)
      if (!authLoading) setIsLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        const [
          clientsRes, kanbanRes, catRes, objRes, projColRes,
          budgetsRes, versionsRes, projectCardsRes,
          assetsRes, hdRes, legacyRes, scoreRes,
        ] = await Promise.all([
          supabase.from('clients').select('*').eq('workspace_id', workspaceId),
          supabase.from('kanban_columns').select('*').eq('workspace_id', workspaceId).order('order'),
          supabase.from('service_categories').select('*').eq('workspace_id', workspaceId).order('order'),
          supabase.from('service_objectives').select('*').eq('workspace_id', workspaceId).order('order'),
          supabase.from('project_columns').select('*').eq('workspace_id', workspaceId).order('order'),
          supabase.from('budgets').select('*').eq('workspace_id', workspaceId),
          supabase.from('budget_versions').select('*').eq('workspace_id', workspaceId),
          supabase.from('project_cards').select('*').eq('workspace_id', workspaceId),
          supabase.from('assets').select('*').eq('workspace_id', workspaceId),
          supabase.from('hard_drives').select('*').eq('workspace_id', workspaceId),
          supabase.from('legacy_projects').select('*').eq('workspace_id', workspaceId),
          supabase.from('score_history').select('*').eq('workspace_id', workspaceId),
        ]);

        // Clients
        setClients((clientsRes.data || []).map(clientFromDb));

        // Settings - seed defaults if empty
        let kanbanData = kanbanRes.data || [];
        if (kanbanData.length === 0) {
          const defaults = DEFAULT_KANBAN_COLUMNS.map(c => ({
            workspace_id: workspaceId, key: c.key, label: c.label, color: c.color, order: c.order, is_default: c.isDefault || false,
          }));
          const { data } = await supabase.from('kanban_columns').insert(defaults).select();
          kanbanData = data || [];
        }
        setKanbanColumns(kanbanData.map(kanbanColumnFromDb));

        let catData = catRes.data || [];
        if (catData.length === 0) {
          const defaults = DEFAULT_SERVICE_CATEGORIES.map(c => ({
            workspace_id: workspaceId, key: c.key, label: c.label, order: c.order, is_default: c.isDefault || false,
          }));
          const { data } = await supabase.from('service_categories').insert(defaults).select();
          catData = data || [];
        }
        setServiceCategories(catData.map(serviceCategoryFromDb));

        let objData = objRes.data || [];
        if (objData.length === 0) {
          const defaults = DEFAULT_SERVICE_OBJECTIVES.map(o => ({
            workspace_id: workspaceId, category_key: o.categoryKey, key: o.key, label: o.label, order: o.order,
          }));
          const { data } = await supabase.from('service_objectives').insert(defaults).select();
          objData = data || [];
        }
        setServiceObjectives(objData.map(serviceObjectiveFromDb));

        let projColData = projColRes.data || [];
        if (projColData.length === 0) {
          const defaults = DEFAULT_PROJECT_COLUMNS.map(c => ({
            workspace_id: workspaceId, key: c.key, label: c.label, color: c.color, order: c.order, is_default: c.isDefault || false,
          }));
          const { data } = await supabase.from('project_columns').insert(defaults).select();
          projColData = data || [];
        }
        setProjectColumns(projColData.map(projectColumnFromDb));

        // Budgets + versions
        const versionsByBudget: Record<string, BudgetVersion[]> = {};
        (versionsRes.data || []).forEach(row => {
          const v = budgetVersionFromDb(row);
          if (!versionsByBudget[v.budgetId]) versionsByBudget[v.budgetId] = [];
          versionsByBudget[v.budgetId].push(v);
        });
        setBudgets((budgetsRes.data || []).map(row => budgetFromDb(row, versionsByBudget[row.id] || [])));

        // Project cards
        setProjectCards((projectCardsRes.data || []).map(projectCardFromDb));

        // Assets, HDs, Legacy, Score
        setAssets((assetsRes.data || []).map(assetFromDb));
        setHardDrives((hdRes.data || []).map(hardDriveFromDb));
        setLegacyProjects((legacyRes.data || []).map(legacyProjectFromDb));
        setScoreHistory((scoreRes.data || []).map(scoreHistoryFromDb));
      } catch (error) {
        console.error('Error loading CRM data:', error);
        toast.error('Erro ao carregar dados do CRM');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, [workspaceId, authLoading]);

  // ============= Client functions =============
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> => {
    if (!workspaceId) return null;
    try {
      const { data, error } = await supabase.from('clients').insert({ ...clientToDb(clientData, workspaceId) }).select().single();
      if (error) throw error;
      const newClient = clientFromDb(data);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (e: any) { toast.error('Erro ao criar cliente: ' + e.message); return null; }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { error } = await supabase.from('clients').update(clientToDb(updates)).eq('id', id);
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));
    } catch (e: any) { toast.error('Erro ao atualizar cliente: ' + e.message); }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e: any) { toast.error('Erro ao deletar cliente: ' + e.message); }
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  const getClientScoreBreakdown = useCallback((clientId: string): ScoreBreakdown => {
    return calculateClientScore(clientId, budgets);
  }, [budgets]);

  const getClientScoreHistory = useCallback((clientId: string): ScoreHistoryEntry[] => {
    return scoreHistory.filter(e => e.id.startsWith(`${clientId}_`) || (e as any).clientId === clientId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [scoreHistory]);

  // Score recalculation
  useEffect(() => {
    if (!workspaceId || isLoading) return;
    const clientsToUpdate = new Set<string>();
    budgets.forEach(b => clientsToUpdate.add(b.clientId));
    clientsToUpdate.forEach(async (clientId) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const scoreBreakdown = calculateClientScore(clientId, budgets);
        if (client.score !== scoreBreakdown.finalScore) {
          // Insert score history
          const reason = scoreBreakdown.finalScore > client.score ? 'Melhoria de score' : 'Recálculo automático';
          try {
            const { data: historyData } = await supabase.from('score_history').insert({
              workspace_id: workspaceId,
              client_id: clientId,
              score: scoreBreakdown.finalScore,
              previous_score: client.score,
              reason,
            }).select().single();
            if (historyData) setScoreHistory(prev => [...prev, scoreHistoryFromDb(historyData)]);
          } catch {}
          // Update client score
          await supabase.from('clients').update({ score: scoreBreakdown.finalScore }).eq('id', clientId);
          setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, score: scoreBreakdown.finalScore, updatedAt: new Date() } : c
          ));
        }
      }
    });
  }, [budgets, workspaceId, isLoading]);

  // ============= Kanban Column functions =============
  const addKanbanColumn = async (columnData: Omit<KanbanColumn, 'id' | 'order'>) => {
    if (!workspaceId) return;
    const maxOrder = Math.max(...kanbanColumns.map(c => c.order), -1);
    try {
      const { data, error } = await supabase.from('kanban_columns').insert({
        workspace_id: workspaceId, key: columnData.key, label: columnData.label,
        color: columnData.color, order: maxOrder + 1, is_default: columnData.isDefault || false,
      }).select().single();
      if (error) throw error;
      setKanbanColumns(prev => [...prev, kanbanColumnFromDb(data)]);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const updateKanbanColumn = async (id: string, updates: Partial<KanbanColumn>) => {
    try {
      const dbUpdates: any = {};
      if (updates.key !== undefined) dbUpdates.key = updates.key;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.order !== undefined) dbUpdates.order = updates.order;
      const { error } = await supabase.from('kanban_columns').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setKanbanColumns(prev => prev.map(col => col.id === id ? { ...col, ...updates } : col));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteKanbanColumn = async (id: string) => {
    const column = kanbanColumns.find(c => c.id === id);
    if (column?.isDefault) return;
    try {
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
      if (error) throw error;
      const firstColumn = kanbanColumns.find(c => c.order === 0);
      if (firstColumn && column) {
        // Move budgets from deleted column to first column
        await supabase.from('budgets').update({ status: firstColumn.key }).eq('workspace_id', workspaceId!).eq('status', column.key);
        setBudgets(prev => prev.map(b => b.status === column.key ? { ...b, status: firstColumn.key } : b));
      }
      setKanbanColumns(prev => prev.filter(col => col.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const reorderKanbanColumns = async (newColumns: KanbanColumn[]) => {
    const reordered = newColumns.map((col, index) => ({ ...col, order: index }));
    setKanbanColumns(reordered);
    try {
      for (const col of reordered) {
        await supabase.from('kanban_columns').update({ order: col.order }).eq('id', col.id);
      }
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const getStatusLabel = (status: CRMStatus): string => {
    return kanbanColumns.find(c => c.key === status)?.label || status;
  };

  // ============= Service Category functions =============
  const addServiceCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'order'>) => {
    if (!workspaceId) return;
    const maxOrder = Math.max(...serviceCategories.map(c => c.order), -1);
    try {
      const { data, error } = await supabase.from('service_categories').insert({
        workspace_id: workspaceId, key: categoryData.key, label: categoryData.label,
        order: maxOrder + 1, is_default: categoryData.isDefault || false,
      }).select().single();
      if (error) throw error;
      setServiceCategories(prev => [...prev, serviceCategoryFromDb(data)]);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const updateServiceCategory = async (id: string, updates: Partial<ServiceCategory>) => {
    try {
      const dbUpdates: any = {};
      if (updates.key !== undefined) dbUpdates.key = updates.key;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      const { error } = await supabase.from('service_categories').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setServiceCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteServiceCategory = async (id: string) => {
    const category = serviceCategories.find(c => c.id === id);
    if (category?.isDefault) return;
    try {
      // Delete related objectives
      await supabase.from('service_objectives').delete().eq('workspace_id', workspaceId!).eq('category_key', category!.key);
      const { error } = await supabase.from('service_categories').delete().eq('id', id);
      if (error) throw error;
      setServiceObjectives(prev => prev.filter(obj => obj.categoryKey !== category?.key));
      setServiceCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const addServiceObjective = async (objectiveData: Omit<ServiceObjective, 'id' | 'order'>) => {
    if (!workspaceId) return;
    const categoryObjectives = serviceObjectives.filter(o => o.categoryKey === objectiveData.categoryKey);
    const maxOrder = Math.max(...categoryObjectives.map(o => o.order), -1);
    try {
      const { data, error } = await supabase.from('service_objectives').insert({
        workspace_id: workspaceId, category_key: objectiveData.categoryKey,
        key: objectiveData.key, label: objectiveData.label, order: maxOrder + 1,
      }).select().single();
      if (error) throw error;
      setServiceObjectives(prev => [...prev, serviceObjectiveFromDb(data)]);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const updateServiceObjective = async (id: string, updates: Partial<ServiceObjective>) => {
    try {
      const dbUpdates: any = {};
      if (updates.key !== undefined) dbUpdates.key = updates.key;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.categoryKey !== undefined) dbUpdates.category_key = updates.categoryKey;
      const { error } = await supabase.from('service_objectives').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setServiceObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteServiceObjective = async (id: string) => {
    try {
      const { error } = await supabase.from('service_objectives').delete().eq('id', id);
      if (error) throw error;
      setServiceObjectives(prev => prev.filter(obj => obj.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const getObjectivesForCategory = (categoryKey: string) => {
    return serviceObjectives.filter(obj => obj.categoryKey === categoryKey)
      .sort((a, b) => a.order - b.order).map(obj => ({ value: obj.key, label: obj.label }));
  };

  const getCategoryLabel = (key: string) => serviceCategories.find(c => c.key === key)?.label || key;

  // ============= Budget functions =============
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>): Promise<Budget | null> => {
    if (!workspaceId) return null;
    try {
      const { data, error } = await supabase.from('budgets').insert({
        workspace_id: workspaceId,
        proposal_id: budgetData.proposalId,
        project_name: budgetData.projectName,
        project_description: budgetData.projectDescription || '',
        client_id: budgetData.clientId,
        service_type: budgetData.serviceType,
        objective: budgetData.objective,
        description: budgetData.description,
        payment_terms: budgetData.paymentTerms,
        includes_tax: budgetData.includesTax,
        includes_logistics: budgetData.includesLogistics,
        includes_accommodation: budgetData.includesAccommodation,
        includes_meals: budgetData.includesMeals,
        includes_raw_material: budgetData.includesRawMaterial ?? false,
        includes_technical_visit: budgetData.includesTechnicalVisit ?? false,
        has_execution_date: budgetData.hasExecutionDate ?? false,
        execution_start_date: budgetData.executionStartDate?.toISOString() || null,
        execution_end_date: budgetData.executionEndDate?.toISOString() || null,
        location: budgetData.location ?? '',
        status: budgetData.status,
      }).select().single();
      if (error) throw error;
      const newBudget = budgetFromDb(data, []);
      setBudgets(prev => [...prev, newBudget]);
      return newBudget;
    } catch (e: any) { toast.error('Erro ao criar orçamento: ' + e.message); return null; }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const dbUpdates: any = {};
      if (updates.proposalId !== undefined) dbUpdates.proposal_id = updates.proposalId;
      if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName;
      if (updates.projectDescription !== undefined) dbUpdates.project_description = updates.projectDescription;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.paymentTerms !== undefined) dbUpdates.payment_terms = updates.paymentTerms;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.includesTax !== undefined) dbUpdates.includes_tax = updates.includesTax;
      if (updates.includesLogistics !== undefined) dbUpdates.includes_logistics = updates.includesLogistics;
      if (updates.includesAccommodation !== undefined) dbUpdates.includes_accommodation = updates.includesAccommodation;
      if (updates.includesMeals !== undefined) dbUpdates.includes_meals = updates.includesMeals;
      if (updates.includesRawMaterial !== undefined) dbUpdates.includes_raw_material = updates.includesRawMaterial;
      if (updates.includesTechnicalVisit !== undefined) dbUpdates.includes_technical_visit = updates.includesTechnicalVisit;
      if (updates.hasExecutionDate !== undefined) dbUpdates.has_execution_date = updates.hasExecutionDate;
      if (updates.executionStartDate !== undefined) dbUpdates.execution_start_date = updates.executionStartDate?.toISOString() || null;
      if (updates.executionEndDate !== undefined) dbUpdates.execution_end_date = updates.executionEndDate?.toISOString() || null;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.contractUrl !== undefined) dbUpdates.contract_url = updates.contractUrl;
      if (updates.nfUrl !== undefined) dbUpdates.nf_url = updates.nfUrl;
      if (updates.approvedVersion !== undefined) dbUpdates.approved_version = updates.approvedVersion;
      if (updates.approvalDate !== undefined) dbUpdates.approval_date = updates.approvalDate?.toISOString() || null;
      if (updates.finalValue !== undefined) dbUpdates.final_value = updates.finalValue;
      if (updates.execution !== undefined) dbUpdates.execution = updates.execution;
      if (updates.currentVersion !== undefined) dbUpdates.current_version = updates.currentVersion;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('budgets').update(dbUpdates).eq('id', id);
        if (error) throw error;
      }
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
    } catch (e: any) { toast.error('Erro ao atualizar orçamento: ' + e.message); }
  };

  const updateBudgetStatus = async (id: string, status: CRMStatus) => {
    await updateBudget(id, { status });
  };

  const deleteBudget = async (id: string) => {
    try {
      await supabase.from('budget_versions').delete().eq('budget_id', id);
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (e: any) { toast.error('Erro ao deletar orçamento: ' + e.message); }
  };

  const getBudget = (id: string) => budgets.find(b => b.id === id);

  const addBudgetVersion = async (budgetId: string, versionData: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => {
    if (!workspaceId) return;
    let currentVersion: number;
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      currentVersion = budget.currentVersion;
    } else {
      // Budget recém-criado, state ainda não atualizou - buscar do DB
      const { data: budgetData } = await supabase
        .from('budgets').select('current_version')
        .eq('id', budgetId).single();
      currentVersion = budgetData?.current_version ?? 0;
    }
    const newVersionNum = currentVersion + 1;
    try {
      const { data, error } = await supabase.from('budget_versions').insert({
        workspace_id: workspaceId, budget_id: budgetId, version: newVersionNum,
        services: versionData.services as any, operational_costs: versionData.operationalCosts as any,
        costs: versionData.costs as any, production_cost: versionData.productionCost,
        fixed_cost_percentage: versionData.fixedCostPercentage, nf_cost_percentage: versionData.nfCostPercentage,
        total_cost: versionData.totalCost, full_price: versionData.fullPrice,
        discount4_price: versionData.discount4Price, discount5_price: versionData.discount5Price,
        margin: versionData.margin, reason: versionData.reason,
        is_rejected: versionData.isRejected || false, rejection_reason: versionData.rejectionReason || null,
      }).select().single();
      if (error) throw error;

      await supabase.from('budgets').update({ current_version: newVersionNum }).eq('id', budgetId);

      const newVersion = budgetVersionFromDb(data);
      setBudgets(prev => prev.map(b => {
        if (b.id === budgetId) {
          return { ...b, versions: [...b.versions, newVersion], currentVersion: newVersionNum, updatedAt: new Date() };
        }
        return b;
      }));
    } catch (e: any) { toast.error('Erro ao adicionar versão: ' + e.message); }
  };

  const updateBudgetVersion = async (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => {
    try {
      const dbUpdates: any = {};
      if (updates.services !== undefined) dbUpdates.services = updates.services;
      if (updates.operationalCosts !== undefined) dbUpdates.operational_costs = updates.operationalCosts;
      if (updates.costs !== undefined) dbUpdates.costs = updates.costs;
      if (updates.productionCost !== undefined) dbUpdates.production_cost = updates.productionCost;
      if (updates.fixedCostPercentage !== undefined) dbUpdates.fixed_cost_percentage = updates.fixedCostPercentage;
      if (updates.nfCostPercentage !== undefined) dbUpdates.nf_cost_percentage = updates.nfCostPercentage;
      if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
      if (updates.fullPrice !== undefined) dbUpdates.full_price = updates.fullPrice;
      if (updates.discount4Price !== undefined) dbUpdates.discount4_price = updates.discount4Price;
      if (updates.discount5Price !== undefined) dbUpdates.discount5_price = updates.discount5Price;
      if (updates.margin !== undefined) dbUpdates.margin = updates.margin;
      if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
      if (updates.isRejected !== undefined) dbUpdates.is_rejected = updates.isRejected;
      if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;

      const { error } = await supabase.from('budget_versions').update(dbUpdates).eq('id', versionId);
      if (error) throw error;
      setBudgets(prev => prev.map(b => {
        if (b.id === budgetId) {
          return { ...b, versions: b.versions.map(v => v.id === versionId ? { ...v, ...updates } : v), updatedAt: new Date() };
        }
        return b;
      }));
    } catch (e: any) { toast.error('Erro ao atualizar versão: ' + e.message); }
  };

  const approveBudget = async (budgetId: string, versionNumber: number) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    const approvedVersion = budget.versions.find(v => v.version === versionNumber);
    let execution: ProjectExecution | null = null;

    if (approvedVersion && approvedVersion.services && approvedVersion.services.length > 0) {
      const opCosts = approvedVersion.operationalCosts || [];
      const opCostsTotal = opCosts.reduce((sum, c) => sum + c.value, 0);
      execution = {
        id: uuidv4(), budgetId, approvedVersionId: approvedVersion.id, executor: '', nfTaxValue: 0,
        services: approvedVersion.services.map(service => {
          const serviceCostTotal = service.costs.reduce((sum, c) => sum + c.value, 0);
          const serviceCalc = calculateServiceTotals(service);
          return {
            id: service.id, serviceType: service.serviceType, objective: service.objective, description: service.description,
            costs: service.costs.map(cost => ({ ...cost, budgetedValue: cost.value, realValue: cost.value, supplier: '' })),
            extraCosts: [], budgetedTotal: serviceCostTotal, realTotal: serviceCostTotal,
            budgetedFinalValue: serviceCalc.finalValue, finalValue: serviceCalc.finalValue, nfTaxProportion: 0,
          };
        }),
        operationalCosts: opCosts.map(cost => ({ ...cost, budgetedValue: cost.value, realValue: cost.value, supplier: '' })),
        extraOperationalCosts: [],
        budgetedTotal: approvedVersion.totalCost + opCostsTotal, realTotal: approvedVersion.totalCost + opCostsTotal, realMargin: approvedVersion.margin,
        isFinalized: false, finalizedAt: null, deliveryLinks: [], createdAt: new Date(), updatedAt: new Date(),
      };
    }

    try {
      await supabase.from('budgets').update({
        status: 'aprovada', approved_version: versionNumber,
        approval_date: new Date().toISOString(), final_value: approvedVersion?.fullPrice || null,
        execution: execution as any,
      }).eq('id', budgetId);

      setBudgets(prev => prev.map(b => {
        if (b.id === budgetId) {
          return {
            ...b, status: 'aprovada' as CRMStatus, approvedVersion: versionNumber,
            approvalDate: new Date(), finalValue: approvedVersion?.fullPrice || null, execution, updatedAt: new Date(),
          };
        }
        return b;
      }));

      // Auto-create project card
      const alreadyExists = projectCards.some(pc => pc.budgetId === budgetId);
      if (!alreadyExists && workspaceId) {
        const client = clients.find(c => c.id === budget.clientId);
        const serviceTypes = approvedVersion?.services ? [...new Set(approvedVersion.services.map(s => s.serviceType))] : [budget.serviceType];
        const objective = approvedVersion?.services?.[0]?.objective || budget.objective || '';
        const firstColKey = [...projectColumns].sort((a, b) => a.order - b.order)[0]?.key || 'planejamento';

        const { data: pcData } = await supabase.from('project_cards').insert({
          workspace_id: workspaceId, budget_id: budgetId, proposal_id: budget.proposalId,
          project_name: budget.projectName, client_name: client?.companyName || 'Cliente não encontrado',
          client_id: budget.clientId, service_types: serviceTypes as any, objective,
          status: firstColKey, progress: 0, tasks: [] as any, links: [] as any, comments: [] as any,
          material_link: '', start_date: budget.executionStartDate?.toISOString() || null,
          end_date: budget.executionEndDate?.toISOString() || null, notes: '',
        }).select().single();
        if (pcData) setProjectCards(prev => [...prev, projectCardFromDb(pcData)]);
      }
    } catch (e: any) { toast.error('Erro ao aprovar orçamento: ' + e.message); }
  };

  // ============= Execution functions (update JSONB on budget) =============
  const persistExecution = async (budgetId: string, execution: ProjectExecution) => {
    try {
      await supabase.from('budgets').update({ execution: execution as any }).eq('id', budgetId);
    } catch (e: any) { console.error('Error persisting execution:', e); }
  };

  const updateExecution = (budgetId: string, executionUpdates: Partial<ProjectExecution>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedExecution = { ...budget.execution, ...executionUpdates, updatedAt: new Date() };
        if (executionUpdates.nfTaxValue !== undefined) {
          const totalServiceValue = updatedExecution.services.reduce((sum, s) => sum + s.realTotal, 0);
          updatedExecution.services = updatedExecution.services.map(service => ({
            ...service, nfTaxProportion: totalServiceValue > 0 ? (service.realTotal / totalServiceValue) * executionUpdates.nfTaxValue! : 0,
          }));
        }
        if (executionUpdates.operationalCosts || executionUpdates.extraOperationalCosts) {
          const serviceTotal = updatedExecution.services.reduce((sum, s) => sum + s.realTotal, 0);
          const opTotal = (updatedExecution.operationalCosts || []).reduce((sum, c) => sum + c.realValue, 0);
          const extraOpTotal = (updatedExecution.extraOperationalCosts || []).reduce((sum, c) => sum + c.realValue, 0);
          updatedExecution.realTotal = serviceTotal + opTotal + extraOpTotal;
          const finalValue = budget.finalValue || updatedExecution.budgetedTotal;
          updatedExecution.realMargin = finalValue > 0 ? ((finalValue - updatedExecution.realTotal) / finalValue) * 100 : 0;
        }
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const updateExecutionCost = (budgetId: string, serviceId: string, costId: string, updates: Partial<ExecutionCostItem>, isExtraCost = false) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedServices = budget.execution.services.map(service => {
          if (service.id === serviceId) {
            let updatedCosts = service.costs;
            let updatedExtraCosts = service.extraCosts || [];
            if (isExtraCost) {
              updatedExtraCosts = updatedExtraCosts.map(cost => cost.id === costId ? { ...cost, ...updates } : cost);
            } else {
              updatedCosts = updatedCosts.map(cost => cost.id === costId ? { ...cost, ...updates } : cost);
            }
            const realTotal = updatedCosts.reduce((sum, c) => sum + c.realValue, 0) + updatedExtraCosts.reduce((sum, c) => sum + c.realValue, 0);
            return { ...service, costs: updatedCosts, extraCosts: updatedExtraCosts, realTotal };
          }
          return service;
        });
        const realTotal = updatedServices.reduce((sum, s) => sum + s.realTotal, 0);
        const finalValue = budget.finalValue || budget.execution.budgetedTotal;
        const realMargin = finalValue > 0 ? ((finalValue - realTotal) / finalValue) * 100 : 0;
        const updatedExecution = { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const addExtraCost = (budgetId: string, serviceId: string, cost: Omit<ExecutionCostItem, 'id' | 'budgetedValue'>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedServices = budget.execution.services.map(service => {
          if (service.id === serviceId) {
            const newCost: ExecutionCostItem = { ...cost, id: uuidv4(), budgetedValue: 0 };
            const updatedExtraCosts = [...(service.extraCosts || []), newCost];
            const realTotal = service.costs.reduce((sum, c) => sum + c.realValue, 0) + updatedExtraCosts.reduce((sum, c) => sum + c.realValue, 0);
            return { ...service, extraCosts: updatedExtraCosts, realTotal };
          }
          return service;
        });
        const realTotal = updatedServices.reduce((sum, s) => sum + s.realTotal, 0);
        const finalValue = budget.finalValue || budget.execution.budgetedTotal;
        const realMargin = finalValue > 0 ? ((finalValue - realTotal) / finalValue) * 100 : 0;
        const updatedExecution = { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const removeExtraCost = (budgetId: string, serviceId: string, costId: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedServices = budget.execution.services.map(service => {
          if (service.id === serviceId) {
            const updatedExtraCosts = (service.extraCosts || []).filter(c => c.id !== costId);
            const realTotal = service.costs.reduce((sum, c) => sum + c.realValue, 0) + updatedExtraCosts.reduce((sum, c) => sum + c.realValue, 0);
            return { ...service, extraCosts: updatedExtraCosts, realTotal };
          }
          return service;
        });
        const realTotal = updatedServices.reduce((sum, s) => sum + s.realTotal, 0);
        const finalValue = budget.finalValue || budget.execution.budgetedTotal;
        const realMargin = finalValue > 0 ? ((finalValue - realTotal) / finalValue) * 100 : 0;
        const updatedExecution = { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const finalizeExecution = (budgetId: string, finalReport?: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedExecution = {
          ...budget.execution, isFinalized: true, finalizedAt: new Date(),
          finalReport: finalReport || budget.execution.finalReport, updatedAt: new Date(),
        };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const addDeliveryLink = (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const newLink: DeliveryLink = { ...link, id: uuidv4(), createdAt: new Date() };
        const updatedExecution = {
          ...budget.execution, deliveryLinks: [...budget.execution.deliveryLinks, newLink], updatedAt: new Date(),
        };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const removeDeliveryLink = (budgetId: string, linkId: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const updatedExecution = {
          ...budget.execution, deliveryLinks: budget.execution.deliveryLinks.filter(l => l.id !== linkId), updatedAt: new Date(),
        };
        persistExecution(budgetId, updatedExecution);
        return { ...budget, execution: updatedExecution, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  // ============= Hard Drive functions =============
  const addHardDrive = async (hdData: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => {
    if (!workspaceId) return;
    try {
      const { data, error } = await supabase.from('hard_drives').insert({
        workspace_id: workspaceId, label: hdData.label, capacity_gb: hdData.capacityGB, projects: [] as any,
      }).select().single();
      if (error) throw error;
      setHardDrives(prev => [...prev, hardDriveFromDb(data)]);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const updateHardDrive = async (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => {
    try {
      const dbUpdates: any = {};
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.capacityGB !== undefined) dbUpdates.capacity_gb = updates.capacityGB;
      const { error } = await supabase.from('hard_drives').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setHardDrives(prev => prev.map(hd => hd.id === id ? { ...hd, ...updates } : hd));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteHardDrive = async (id: string) => {
    try {
      const { error } = await supabase.from('hard_drives').delete().eq('id', id);
      if (error) throw error;
      setHardDrives(prev => prev.filter(hd => hd.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const allocateProjectToHD = async (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => {
    const hd = hardDrives.find(h => h.id === hdId);
    if (!hd) return;
    const newAllocation: HDProjectAllocation = { ...allocation, id: uuidv4(), allocatedAt: new Date() };
    const updatedProjects = [...hd.projects, newAllocation];
    try {
      const { error } = await supabase.from('hard_drives').update({ projects: updatedProjects as any }).eq('id', hdId);
      if (error) throw error;
      setHardDrives(prev => prev.map(h => h.id === hdId ? { ...h, projects: updatedProjects } : h));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const removeProjectFromHD = async (hdId: string, allocationId: string) => {
    const hd = hardDrives.find(h => h.id === hdId);
    if (!hd) return;
    const updatedProjects = hd.projects.filter(p => p.id !== allocationId);
    try {
      const { error } = await supabase.from('hard_drives').update({ projects: updatedProjects as any }).eq('id', hdId);
      if (error) throw error;
      setHardDrives(prev => prev.map(h => h.id === hdId ? { ...h, projects: updatedProjects } : h));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  // ============= Legacy Project functions =============
  const addLegacyProject = async (projectData: Omit<LegacyProject, 'id' | 'createdAt'>): Promise<LegacyProject | null> => {
    if (!workspaceId) return null;
    try {
      const { data, error } = await supabase.from('legacy_projects').insert({
        workspace_id: workspaceId, project_number: projectData.projectNumber,
        client_id: projectData.clientId, client_name: projectData.clientName, size_gb: projectData.sizeGB,
      }).select().single();
      if (error) throw error;
      const newProject = legacyProjectFromDb(data);
      setLegacyProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (e: any) { toast.error('Erro: ' + e.message); return null; }
  };

  const deleteLegacyProject = async (id: string) => {
    try {
      const { error } = await supabase.from('legacy_projects').delete().eq('id', id);
      if (error) throw error;
      setLegacyProjects(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const getLegacyProject = (id: string) => legacyProjects.find(p => p.id === id);

  const getHDForBudget = useCallback((budgetId: string): { hdLabel: string; hdId: string } | null => {
    for (const hd of hardDrives) {
      if (hd.projects.some(p => p.budgetId === budgetId)) return { hdLabel: hd.label, hdId: hd.id };
    }
    return null;
  }, [hardDrives]);

  // ============= Asset functions =============
  const addAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset | null> => {
    if (!workspaceId) return null;
    try {
      const { data, error } = await supabase.from('assets').insert({
        workspace_id: workspaceId, name: assetData.name, description: assetData.description,
        value: assetData.value, serial_number: assetData.serialNumber,
        hero_asset_number: assetData.heroAssetNumber, photo: assetData.photo,
        reference_link: assetData.referenceLink, assigned_to: assetData.assignedTo,
      }).select().single();
      if (error) throw error;
      const newAsset = assetFromDb(data);
      setAssets(prev => [...prev, newAsset]);
      return newAsset;
    } catch (e: any) { toast.error('Erro: ' + e.message); return null; }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
      if (updates.heroAssetNumber !== undefined) dbUpdates.hero_asset_number = updates.heroAssetNumber;
      if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
      if (updates.referenceLink !== undefined) dbUpdates.reference_link = updates.referenceLink;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
      const { error } = await supabase.from('assets').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  // ============= Project Card functions =============
  const updateProjectCard = async (id: string, updates: Partial<ProjectCard>) => {
    try {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks as any;
      if (updates.links !== undefined) dbUpdates.links = updates.links as any;
      if (updates.comments !== undefined) dbUpdates.comments = updates.comments as any;
      if (updates.materialLink !== undefined) dbUpdates.material_link = updates.materialLink;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate?.toISOString() || null;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate?.toISOString() || null;
      if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName;
      if (updates.objective !== undefined) dbUpdates.objective = updates.objective;
      if (updates.serviceTypes !== undefined) dbUpdates.service_types = updates.serviceTypes as any;

      const { error } = await supabase.from('project_cards').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setProjectCards(prev => prev.map(card => card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const addProjectColumn = async (colData: Omit<ProjectColumn, 'id' | 'order'>) => {
    if (!workspaceId) return;
    const maxOrder = Math.max(...projectColumns.map(c => c.order), -1);
    try {
      const { data, error } = await supabase.from('project_columns').insert({
        workspace_id: workspaceId, key: colData.key, label: colData.label,
        color: colData.color, order: maxOrder + 1, is_default: colData.isDefault || false,
      }).select().single();
      if (error) throw error;
      setProjectColumns(prev => [...prev, projectColumnFromDb(data)]);
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const updateProjectColumn = async (id: string, updates: Partial<ProjectColumn>) => {
    try {
      const dbUpdates: any = {};
      if (updates.key !== undefined) dbUpdates.key = updates.key;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      const { error } = await supabase.from('project_columns').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setProjectColumns(prev => prev.map(col => col.id === id ? { ...col, ...updates } : col));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  const deleteProjectColumn = async (id: string) => {
    const col = projectColumns.find(c => c.id === id);
    if (col?.isDefault) return;
    try {
      const firstCol = projectColumns.sort((a, b) => a.order - b.order)[0];
      if (firstCol && col) {
        await supabase.from('project_cards').update({ status: firstCol.key }).eq('workspace_id', workspaceId!).eq('status', col.key);
        setProjectCards(prev => prev.map(card => card.status === col.key ? { ...card, status: firstCol.key } : card));
      }
      const { error } = await supabase.from('project_columns').delete().eq('id', id);
      if (error) throw error;
      setProjectColumns(prev => prev.filter(c => c.id !== id));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  };

  // ============= CRM Card functions =============
  const getCRMCards = (): CRMCard[] => {
    return budgets.map(budget => {
      const client = getClient(budget.clientId);
      const currentVersionData = budget.versions.find(v => v.version === budget.currentVersion);
      const serviceTypes: ServiceType[] = currentVersionData?.services
        ? [...new Set(currentVersionData.services.map(s => s.serviceType))] : [budget.serviceType];
      return {
        id: budget.id, budgetId: budget.id,
        projectName: `${budget.proposalId} - ${budget.projectName}`,
        clientName: client?.companyName || 'Cliente não encontrado',
        clientId: budget.clientId, serviceType: budget.serviceType, serviceTypes,
        value: currentVersionData?.fullPrice || null, status: budget.status,
        clientScore: client?.score || 0, currentVersion: budget.currentVersion,
      };
    });
  };

  const getCardsByStatus = (status: CRMStatus) => getCRMCards()
    .filter(card => card.status === status)
    .sort((a, b) => {
      const numA = parseInt(a.projectName, 10);
      const numB = parseInt(b.projectName, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.projectName.localeCompare(b.projectName);
    });

  const moveCard = (cardId: string, newStatus: CRMStatus) => {
    updateBudgetStatus(cardId, newStatus);
  };

  const value: CRMContextType = {
    isLoading,
    clients, addClient, updateClient, deleteClient, getClient, getClientScoreBreakdown,
    budgets, addBudget, updateBudget, updateBudgetStatus, deleteBudget, getBudget,
    addBudgetVersion, updateBudgetVersion, approveBudget,
    updateExecution, updateExecutionCost, addExtraCost, removeExtraCost, finalizeExecution, addDeliveryLink, removeDeliveryLink,
    kanbanColumns, addKanbanColumn, updateKanbanColumn, deleteKanbanColumn, reorderKanbanColumns, getStatusLabel,
    serviceCategories, serviceObjectives, addServiceCategory, updateServiceCategory, deleteServiceCategory,
    addServiceObjective, updateServiceObjective, deleteServiceObjective, getObjectivesForCategory, getCategoryLabel,
    hardDrives, addHardDrive, updateHardDrive, deleteHardDrive, allocateProjectToHD, removeProjectFromHD,
    legacyProjects, addLegacyProject, deleteLegacyProject, getLegacyProject, getHDForBudget,
    scoreHistory, getClientScoreHistory,
    assets, addAsset, updateAsset, deleteAsset,
    projectCards, projectColumns, updateProjectCard, addProjectColumn, updateProjectColumn, deleteProjectColumn,
    getCRMCards, getCardsByStatus, moveCard,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
