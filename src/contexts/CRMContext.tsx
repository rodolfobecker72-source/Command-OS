import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  getObjectivesByService,
} from '@/types/crm';
import { calculateClientScore, ScoreBreakdown } from '@/utils/clientScore';
import type { ScoreHistoryEntry } from '@/components/client/ScoreHistory';
import { clientService } from '@/services/clientService';
import { budgetService } from '@/services/budgetService';
import { settingsService } from '@/services/settingsService';
import { assetService } from '@/services/assetService';
import { storageService } from '@/services/storageService';
import { scoreHistoryService } from '@/services/scoreHistoryService';
import { projectCardService } from '@/services/projectCardService';
import { useAuth } from '@/contexts/AuthContext';

interface CRMContextType {
  // Clients
  clients: Client[];
  clientsLoading: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  getClientScoreBreakdown: (clientId: string) => ScoreBreakdown;
  refreshClients: () => Promise<void>;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'proposalId' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  updateBudgetStatus: (id: string, status: CRMStatus) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudget: (id: string) => Budget | undefined;

  // Budget Versions
  addBudgetVersion: (budgetId: string, version: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => Promise<void>;
  updateBudgetVersion: (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => Promise<void>;
  approveBudget: (budgetId: string, versionNumber: number) => Promise<void>;

  // Execution
  updateExecution: (budgetId: string, execution: Partial<ProjectExecution>) => Promise<void>;
  updateExecutionCost: (budgetId: string, serviceId: string, costId: string, updates: Partial<ExecutionCostItem>, isExtraCost?: boolean) => Promise<void>;
  addExtraCost: (budgetId: string, serviceId: string, cost: Omit<ExecutionCostItem, 'id' | 'budgetedValue'>) => Promise<void>;
  removeExtraCost: (budgetId: string, serviceId: string, costId: string) => Promise<void>;
  finalizeExecution: (budgetId: string, finalReport?: string) => Promise<void>;
  addDeliveryLink: (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => Promise<void>;
  removeDeliveryLink: (budgetId: string, linkId: string) => Promise<void>;

  // Kanban Columns
  kanbanColumns: KanbanColumn[];
  addKanbanColumn: (column: Omit<KanbanColumn, 'id' | 'order'>) => Promise<void>;
  updateKanbanColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteKanbanColumn: (id: string) => Promise<void>;
  reorderKanbanColumns: (columns: KanbanColumn[]) => Promise<void>;
  getStatusLabel: (status: CRMStatus) => string;

  // Service Categories
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

  // Hard Drives
  hardDrives: HardDrive[];
  addHardDrive: (hd: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => Promise<void>;
  updateHardDrive: (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => Promise<void>;
  deleteHardDrive: (id: string) => Promise<void>;
  allocateProjectToHD: (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => Promise<void>;
  removeProjectFromHD: (hdId: string, allocationId: string) => Promise<void>;

  // Legacy Projects
  legacyProjects: LegacyProject[];
  addLegacyProject: (project: Omit<LegacyProject, 'id' | 'createdAt'>) => Promise<LegacyProject>;
  deleteLegacyProject: (id: string) => Promise<void>;
  getLegacyProject: (id: string) => LegacyProject | undefined;
  getHDForBudget: (budgetId: string) => { hdLabel: string; hdId: string } | null;

  // Score History
  scoreHistory: ScoreHistoryEntry[];
  getClientScoreHistory: (clientId: string) => ScoreHistoryEntry[];

  // Assets (Patrimônio)
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Asset>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // Project Management
  projectCards: ProjectCard[];
  projectColumns: ProjectColumn[];
  updateProjectCard: (id: string, updates: Partial<ProjectCard>) => Promise<void>;
  addProjectColumn: (column: Omit<ProjectColumn, 'id' | 'order'>) => Promise<void>;
  updateProjectColumn: (id: string, updates: Partial<ProjectColumn>) => Promise<void>;
  deleteProjectColumn: (id: string) => Promise<void>;

  // CRM Cards (derived from budgets)
  getCRMCards: () => CRMCard[];
  getCardsByStatus: (status: CRMStatus) => CRMCard[];
  moveCard: (cardId: string, newStatus: CRMStatus) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const { workspace } = useAuth();

  // All state - initialized empty, loaded from DB
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
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

  // Load all data from DB
  const refreshClients = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const data = await clientService.getAll(workspace.id);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setClientsLoading(false);
    }
  }, [workspace?.id]);

  const loadAllData = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const [
        budgetsData, kanbanData, categoriesData, objectivesData,
        hdData, legacyData, historyData, assetsData, cardsData, colsData,
      ] = await Promise.all([
        budgetService.getAll(workspace.id),
        settingsService.getKanbanColumns(workspace.id),
        settingsService.getServiceCategories(workspace.id),
        settingsService.getServiceObjectives(workspace.id),
        storageService.getHardDrives(workspace.id),
        storageService.getLegacyProjects(workspace.id),
        scoreHistoryService.getAll(workspace.id),
        assetService.getAll(workspace.id),
        projectCardService.getAll(workspace.id),
        settingsService.getProjectColumns(workspace.id),
      ]);
      setBudgets(budgetsData);
      setKanbanColumns(kanbanData);
      setServiceCategories(categoriesData);
      setServiceObjectives(objectivesData);
      setHardDrives(hdData);
      setLegacyProjects(legacyData);
      setScoreHistory(historyData);
      setAssets(assetsData);
      setProjectCards(cardsData);
      setProjectColumns(colsData);
    } catch (error) {
      console.error('Error loading CRM data:', error);
    }
  }, [workspace?.id]);

  useEffect(() => {
    refreshClients();
    loadAllData();
  }, [refreshClients, loadAllData]);

  // ============= Helper: persist budget update to DB =============
  const persistBudgetUpdate = async (id: string, updater: (budget: Budget) => Budget) => {
    let updatedBudget: Budget | null = null;
    setBudgets(prev => prev.map(b => {
      if (b.id === id) {
        updatedBudget = updater(b);
        return updatedBudget;
      }
      return b;
    }));
    if (updatedBudget) {
      const { versions, ...rest } = updatedBudget as Budget;
      await budgetService.update(id, rest);
    }
  };

  // ============= Kanban column functions =============
  const addKanbanColumn = async (columnData: Omit<KanbanColumn, 'id' | 'order'>) => {
    const maxOrder = Math.max(...kanbanColumns.map(c => c.order), -1);
    const newColumn: KanbanColumn = { ...columnData, id: uuidv4(), order: maxOrder + 1 };
    setKanbanColumns(prev => [...prev, newColumn]);
    await settingsService.persistKanbanColumns(workspace!.id, [...kanbanColumns, newColumn]);
  };

  const updateKanbanColumn = async (id: string, updates: Partial<KanbanColumn>) => {
    const updated = kanbanColumns.map(col => (col.id === id ? { ...col, ...updates } : col));
    setKanbanColumns(updated);
    await settingsService.persistKanbanColumns(workspace!.id, updated);
  };

  const deleteKanbanColumn = async (id: string) => {
    const column = kanbanColumns.find(c => c.id === id);
    if (column?.isDefault) return;
    const firstColumn = kanbanColumns.find(c => c.order === 0);
    if (firstColumn && column) {
      // Move budgets in deleted column to first column
      for (const budget of budgets.filter(b => b.status === column.key)) {
        await budgetService.update(budget.id, { status: firstColumn.key } as any);
      }
      setBudgets(prev => prev.map(budget =>
        budget.status === column.key ? { ...budget, status: firstColumn.key } : budget
      ));
    }
    const updated = kanbanColumns.filter(col => col.id !== id);
    setKanbanColumns(updated);
    await settingsService.persistKanbanColumns(workspace!.id, updated);
  };

  const reorderKanbanColumns = async (newColumns: KanbanColumn[]) => {
    const reordered = newColumns.map((col, index) => ({ ...col, order: index }));
    setKanbanColumns(reordered);
    await settingsService.persistKanbanColumns(workspace!.id, reordered);
  };

  const getStatusLabel = (status: CRMStatus): string => {
    const column = kanbanColumns.find(c => c.key === status);
    return column?.label || status;
  };

  // ============= Service Category functions =============
  const addServiceCategory = async (categoryData: Omit<ServiceCategory, 'id' | 'order'>) => {
    const maxOrder = Math.max(...serviceCategories.map(c => c.order), -1);
    const newCategory: ServiceCategory = { ...categoryData, id: uuidv4(), order: maxOrder + 1 };
    const updated = [...serviceCategories, newCategory];
    setServiceCategories(updated);
    await settingsService.persistServiceCategories(workspace!.id, updated);
  };

  const updateServiceCategory = async (id: string, updates: Partial<ServiceCategory>) => {
    const updated = serviceCategories.map(cat => (cat.id === id ? { ...cat, ...updates } : cat));
    setServiceCategories(updated);
    await settingsService.persistServiceCategories(workspace!.id, updated);
  };

  const deleteServiceCategory = async (id: string) => {
    const category = serviceCategories.find(c => c.id === id);
    if (category?.isDefault) return;
    const updatedObjectives = serviceObjectives.filter(obj => obj.categoryKey !== category?.key);
    const updatedCategories = serviceCategories.filter(cat => cat.id !== id);
    setServiceObjectives(updatedObjectives);
    setServiceCategories(updatedCategories);
    await Promise.all([
      settingsService.persistServiceCategories(workspace!.id, updatedCategories),
      settingsService.persistServiceObjectives(workspace!.id, updatedObjectives),
    ]);
  };

  const addServiceObjective = async (objectiveData: Omit<ServiceObjective, 'id' | 'order'>) => {
    const categoryObjectives = serviceObjectives.filter(o => o.categoryKey === objectiveData.categoryKey);
    const maxOrder = Math.max(...categoryObjectives.map(o => o.order), -1);
    const newObjective: ServiceObjective = { ...objectiveData, id: uuidv4(), order: maxOrder + 1 };
    const updated = [...serviceObjectives, newObjective];
    setServiceObjectives(updated);
    await settingsService.persistServiceObjectives(workspace!.id, updated);
  };

  const updateServiceObjective = async (id: string, updates: Partial<ServiceObjective>) => {
    const updated = serviceObjectives.map(obj => (obj.id === id ? { ...obj, ...updates } : obj));
    setServiceObjectives(updated);
    await settingsService.persistServiceObjectives(workspace!.id, updated);
  };

  const deleteServiceObjective = async (id: string) => {
    const updated = serviceObjectives.filter(obj => obj.id !== id);
    setServiceObjectives(updated);
    await settingsService.persistServiceObjectives(workspace!.id, updated);
  };

  const getObjectivesForCategory = (categoryKey: string): { value: string; label: string }[] => {
    return serviceObjectives
      .filter(obj => obj.categoryKey === categoryKey)
      .sort((a, b) => a.order - b.order)
      .map(obj => ({ value: obj.key, label: obj.label }));
  };

  const getCategoryLabel = (key: string): string => {
    const category = serviceCategories.find(c => c.key === key);
    return category?.label || key;
  };

  // ============= Hard Drive functions =============
  const addHardDrive = async (hdData: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => {
    const newHD = await storageService.createHardDrive(workspace!.id, hdData);
    setHardDrives(prev => [...prev, newHD]);
  };

  const updateHardDrive = async (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => {
    await storageService.updateHardDrive(id, updates);
    setHardDrives(prev => prev.map(hd => hd.id === id ? { ...hd, ...updates } : hd));
  };

  const deleteHardDrive = async (id: string) => {
    await storageService.deleteHardDrive(id);
    setHardDrives(prev => prev.filter(hd => hd.id !== id));
  };

  const allocateProjectToHD = async (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => {
    const hd = hardDrives.find(h => h.id === hdId);
    if (!hd) return;
    const newAllocation: HDProjectAllocation = { ...allocation, id: uuidv4(), allocatedAt: new Date() };
    const updatedProjects = [...hd.projects, newAllocation];
    await storageService.updateHardDrive(hdId, { projects: updatedProjects });
    setHardDrives(prev => prev.map(h => h.id === hdId ? { ...h, projects: updatedProjects } : h));
  };

  const removeProjectFromHD = async (hdId: string, allocationId: string) => {
    const hd = hardDrives.find(h => h.id === hdId);
    if (!hd) return;
    const updatedProjects = hd.projects.filter(p => p.id !== allocationId);
    await storageService.updateHardDrive(hdId, { projects: updatedProjects });
    setHardDrives(prev => prev.map(h => h.id === hdId ? { ...h, projects: updatedProjects } : h));
  };

  // ============= Legacy Project functions =============
  const addLegacyProject = async (projectData: Omit<LegacyProject, 'id' | 'createdAt'>): Promise<LegacyProject> => {
    const newProject = await storageService.createLegacyProject(workspace!.id, projectData);
    setLegacyProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const deleteLegacyProject = async (id: string) => {
    await storageService.deleteLegacyProject(id);
    setLegacyProjects(prev => prev.filter(p => p.id !== id));
  };

  const getLegacyProject = (id: string) => {
    return legacyProjects.find(p => p.id === id);
  };

  const getHDForBudget = useCallback((budgetId: string): { hdLabel: string; hdId: string } | null => {
    for (const hd of hardDrives) {
      if (hd.projects.some(p => p.budgetId === budgetId)) {
        return { hdLabel: hd.label, hdId: hd.id };
      }
    }
    return null;
  }, [hardDrives]);

  // ============= Asset functions =============
  const addAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> => {
    const newAsset = await assetService.create(workspace!.id, assetData);
    setAssets(prev => [...prev, newAsset]);
    return newAsset;
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    await assetService.update(id, updates);
    setAssets(prev => prev.map(asset =>
      asset.id === id ? { ...asset, ...updates, updatedAt: new Date() } : asset
    ));
  };

  const deleteAsset = async (id: string) => {
    await assetService.delete(id);
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // ============= Project Management functions =============
  const updateProjectCard = async (id: string, updates: Partial<ProjectCard>) => {
    await projectCardService.update(id, updates);
    setProjectCards(prev => prev.map(card => card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card));
  };

  const addProjectColumn = async (colData: Omit<ProjectColumn, 'id' | 'order'>) => {
    const maxOrder = Math.max(...projectColumns.map(c => c.order), -1);
    const updated = [...projectColumns, { ...colData, id: uuidv4(), order: maxOrder + 1 }];
    setProjectColumns(updated);
    await settingsService.persistProjectColumns(workspace!.id, updated);
  };

  const updateProjectColumn = async (id: string, updates: Partial<ProjectColumn>) => {
    const updated = projectColumns.map(col => col.id === id ? { ...col, ...updates } : col);
    setProjectColumns(updated);
    await settingsService.persistProjectColumns(workspace!.id, updated);
  };

  const deleteProjectColumn = async (id: string) => {
    const col = projectColumns.find(c => c.id === id);
    if (col?.isDefault) return;
    const firstCol = [...projectColumns].sort((a, b) => a.order - b.order)[0];
    if (firstCol && col) {
      for (const card of projectCards.filter(c => c.status === col.key)) {
        await projectCardService.update(card.id, { status: firstCol.key });
      }
      setProjectCards(prev => prev.map(card => card.status === col.key ? { ...card, status: firstCol.key } : card));
    }
    const updated = projectColumns.filter(c => c.id !== id);
    setProjectColumns(updated);
    await settingsService.persistProjectColumns(workspace!.id, updated);
  };

  // ============= Client functions =============
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    if (!workspace?.id) throw new Error('No workspace');
    const newClient = await clientService.create(workspace.id, clientData);
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    await clientService.update(id, updates);
    setClients(prev => prev.map(client =>
      client.id === id ? { ...client, ...updates, updatedAt: new Date() } : client
    ));
  };

  const deleteClient = async (id: string) => {
    await clientService.delete(id);
    setClients(prev => prev.filter(client => client.id !== id));
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

  const getClientScoreBreakdown = useCallback((clientId: string): ScoreBreakdown => {
    return calculateClientScore(clientId, budgets);
  }, [budgets]);

  const getClientScoreHistory = useCallback((clientId: string): ScoreHistoryEntry[] => {
    return scoreHistory
      .filter(entry => (entry as any).clientId === clientId || entry.id.startsWith?.(`${clientId}_`))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [scoreHistory]);

  const getScoreChangeReason = useCallback((clientId: string, newBreakdown: ScoreBreakdown, oldScore: number): string => {
    if (oldScore === 0 && newBreakdown.finalScore !== 0) {
      return 'Primeiro cálculo de score';
    }
    const parts: string[] = [];
    if (newBreakdown.recurrencePoints > 0) parts.push(`Recorrência: +${newBreakdown.recurrencePoints}`);
    if (newBreakdown.marginPoints > 0) parts.push(`Margem: +${newBreakdown.marginPoints}`);
    if (newBreakdown.commercialPenalty > 0) parts.push(`Penalidade: -${newBreakdown.commercialPenalty}`);
    return parts.join(' | ') || 'Recálculo automático';
  }, []);

  // Recalculate all client scores when budgets change
  useEffect(() => {
    if (clients.length === 0 || !workspace?.id) return;
    const clientsToUpdate = new Set<string>();
    budgets.forEach(b => clientsToUpdate.add(b.clientId));
    clientsToUpdate.forEach(clientId => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const scoreBreakdown = calculateClientScore(clientId, budgets);
        if (client.score !== scoreBreakdown.finalScore) {
          const reason = getScoreChangeReason(clientId, scoreBreakdown, client.score);
          // Save score history to DB
          scoreHistoryService.add(workspace.id, clientId, {
            score: scoreBreakdown.finalScore,
            previousScore: client.score,
            reason,
          }).catch(console.error);
          setScoreHistory(prev => [...prev, {
            id: uuidv4(),
            score: scoreBreakdown.finalScore,
            previousScore: client.score,
            reason,
            timestamp: new Date(),
          }]);
          // Update score in DB
          clientService.update(clientId, { score: scoreBreakdown.finalScore }).catch(console.error);
          setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, score: scoreBreakdown.finalScore, updatedAt: new Date() } : c
          ));
        }
      }
    });
  }, [budgets, clients.length]);

  // ============= Budget functions =============
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'proposalId' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>): Promise<Budget> => {
    if (!workspace?.id) throw new Error('No workspace');
    const proposalId = await budgetService.getNextProposalId(workspace.id);
    const newBudget = await budgetService.create(workspace.id, {
      ...budgetData,
      proposalId,
      projectDescription: budgetData.projectDescription || '',
      includesRawMaterial: budgetData.includesRawMaterial ?? false,
      hasExecutionDate: budgetData.hasExecutionDate ?? false,
      executionStartDate: budgetData.executionStartDate ?? null,
      executionEndDate: budgetData.executionEndDate ?? null,
      location: budgetData.location ?? '',
      currentVersion: 0,
      approvedVersion: null,
      approvalDate: null,
      finalValue: null,
      contractUrl: null,
      nfUrl: null,
      execution: null,
    });
    setBudgets(prev => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const { versions, ...dbUpdates } = updates as any;
    await budgetService.update(id, dbUpdates);
    setBudgets(prev => prev.map(budget =>
      budget.id === id ? { ...budget, ...updates, updatedAt: new Date() } : budget
    ));
  };

  const updateBudgetStatus = async (id: string, status: CRMStatus) => {
    await updateBudget(id, { status });
  };

  const deleteBudget = async (id: string) => {
    await budgetService.delete(id);
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const getBudget = (id: string) => {
    return budgets.find(budget => budget.id === id);
  };

  // Budget Version functions
  const addBudgetVersion = async (budgetId: string, versionData: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget || !workspace?.id) return;
    const newVersionNumber = budget.currentVersion + 1;
    const newVersion = await budgetService.addVersion(workspace.id, budgetId, {
      ...versionData, version: newVersionNumber,
    });
    await budgetService.update(budgetId, { currentVersion: newVersionNumber } as any);
    setBudgets(prev => prev.map(b => {
      if (b.id === budgetId) {
        return { ...b, versions: [...b.versions, newVersion], currentVersion: newVersionNumber, updatedAt: new Date() };
      }
      return b;
    }));
  };

  const updateBudgetVersion = async (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => {
    await budgetService.updateVersion(versionId, updates);
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId) {
        return {
          ...budget,
          versions: budget.versions.map(version => version.id === versionId ? { ...version, ...updates } : version),
          updatedAt: new Date(),
        };
      }
      return budget;
    }));
  };

  const approveBudget = async (budgetId: string, versionNumber: number) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget || !workspace?.id) return;

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

    const budgetUpdates: Partial<Budget> = {
      status: 'aprovada' as CRMStatus,
      approvedVersion: versionNumber,
      approvalDate: new Date(),
      finalValue: approvedVersion?.fullPrice || null,
      execution,
    };

    await budgetService.update(budgetId, budgetUpdates as any);
    setBudgets(prev => prev.map(b => b.id === budgetId ? { ...b, ...budgetUpdates, updatedAt: new Date() } : b));

    // Auto-create project card
    const alreadyExists = projectCards.some(pc => pc.budgetId === budgetId);
    if (!alreadyExists) {
      const client = clients.find(c => c.id === budget.clientId);
      const serviceTypes = approvedVersion?.services ? [...new Set(approvedVersion.services.map(s => s.serviceType))] : [budget.serviceType];
      const objective = approvedVersion?.services?.[0]?.objective || budget.objective || '';
      const firstColKey = [...projectColumns].sort((a, b) => a.order - b.order)[0]?.key || 'planejamento';
      const newProjectCard = await projectCardService.create(workspace.id, {
        budgetId, proposalId: budget.proposalId, projectName: budget.projectName,
        clientName: client?.companyName || 'Cliente não encontrado', clientId: budget.clientId,
        serviceTypes, objective, status: firstColKey, progress: 0, tasks: [], links: [], comments: [],
        materialLink: '', startDate: budget.executionStartDate, endDate: budget.executionEndDate,
        notes: '',
      });
      setProjectCards(prev => [...prev, newProjectCard]);
    }
  };

  // ============= Execution functions =============
  const updateExecution = async (budgetId: string, executionUpdates: Partial<ProjectExecution>) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
      const updatedExecution = { ...budget.execution, ...executionUpdates, updatedAt: new Date() };
      if (executionUpdates.nfTaxValue !== undefined) {
        const totalServiceValue = updatedExecution.services.reduce((sum, s) => sum + s.realTotal, 0);
        updatedExecution.services = updatedExecution.services.map(service => ({
          ...service,
          nfTaxProportion: totalServiceValue > 0 ? (service.realTotal / totalServiceValue) * executionUpdates.nfTaxValue! : 0,
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
      return { ...budget, execution: updatedExecution, updatedAt: new Date() };
    });
  };

  const updateExecutionCost = async (budgetId: string, serviceId: string, costId: string, updates: Partial<ExecutionCostItem>, isExtraCost = false) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
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
      const budgetedTotal = budget.execution.budgetedTotal;
      const finalValue = budget.finalValue || budgetedTotal;
      const realMargin = finalValue > 0 ? ((finalValue - realTotal) / finalValue) * 100 : 0;
      return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
    });
  };

  const addExtraCost = async (budgetId: string, serviceId: string, cost: Omit<ExecutionCostItem, 'id' | 'budgetedValue'>) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
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
      return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
    });
  };

  const removeExtraCost = async (budgetId: string, serviceId: string, costId: string) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
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
      return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
    });
  };

  const finalizeExecution = async (budgetId: string, finalReport?: string) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
      return {
        ...budget,
        execution: { ...budget.execution, isFinalized: true, finalizedAt: new Date(), finalReport: finalReport || budget.execution.finalReport, updatedAt: new Date() },
        updatedAt: new Date(),
      };
    });
  };

  const addDeliveryLink = async (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
      const newLink: DeliveryLink = { ...link, id: uuidv4(), createdAt: new Date() };
      return {
        ...budget,
        execution: { ...budget.execution, deliveryLinks: [...budget.execution.deliveryLinks, newLink], updatedAt: new Date() },
        updatedAt: new Date(),
      };
    });
  };

  const removeDeliveryLink = async (budgetId: string, linkId: string) => {
    await persistBudgetUpdate(budgetId, (budget) => {
      if (!budget.execution) return budget;
      return {
        ...budget,
        execution: { ...budget.execution, deliveryLinks: budget.execution.deliveryLinks.filter(l => l.id !== linkId), updatedAt: new Date() },
        updatedAt: new Date(),
      };
    });
  };

  // ============= CRM Card functions =============
  const getCRMCards = (): CRMCard[] => {
    return budgets.map(budget => {
      const client = getClient(budget.clientId);
      const currentVersionData = budget.versions.find(v => v.version === budget.currentVersion);
      const serviceTypes: ServiceType[] = currentVersionData?.services
        ? [...new Set(currentVersionData.services.map(s => s.serviceType))]
        : [budget.serviceType];
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

  const getCardsByStatus = (status: CRMStatus): CRMCard[] => {
    return getCRMCards().filter(card => card.status === status);
  };

  const moveCard = (cardId: string, newStatus: CRMStatus) => {
    updateBudgetStatus(cardId, newStatus);
  };

  const value: CRMContextType = {
    clients, clientsLoading, addClient, updateClient, deleteClient, getClient, getClientScoreBreakdown, refreshClients,
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
