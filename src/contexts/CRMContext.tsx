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

  // Budgets (still localStorage for now)
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'proposalId' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  updateBudgetStatus: (id: string, status: CRMStatus) => void;
  deleteBudget: (id: string) => void;
  getBudget: (id: string) => Budget | undefined;

  // Budget Versions
  addBudgetVersion: (budgetId: string, version: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => void;
  updateBudgetVersion: (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => void;
  approveBudget: (budgetId: string, versionNumber: number) => void;

  // Execution
  updateExecution: (budgetId: string, execution: Partial<ProjectExecution>) => void;
  updateExecutionCost: (budgetId: string, serviceId: string, costId: string, updates: Partial<ExecutionCostItem>, isExtraCost?: boolean) => void;
  addExtraCost: (budgetId: string, serviceId: string, cost: Omit<ExecutionCostItem, 'id' | 'budgetedValue'>) => void;
  removeExtraCost: (budgetId: string, serviceId: string, costId: string) => void;
  finalizeExecution: (budgetId: string, finalReport?: string) => void;
  addDeliveryLink: (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => void;
  removeDeliveryLink: (budgetId: string, linkId: string) => void;

  // Kanban Columns
  kanbanColumns: KanbanColumn[];
  addKanbanColumn: (column: Omit<KanbanColumn, 'id' | 'order'>) => void;
  updateKanbanColumn: (id: string, updates: Partial<KanbanColumn>) => void;
  deleteKanbanColumn: (id: string) => void;
  reorderKanbanColumns: (columns: KanbanColumn[]) => void;
  getStatusLabel: (status: CRMStatus) => string;

  // Service Categories
  serviceCategories: ServiceCategory[];
  serviceObjectives: ServiceObjective[];
  addServiceCategory: (category: Omit<ServiceCategory, 'id' | 'order'>) => void;
  updateServiceCategory: (id: string, updates: Partial<ServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;
  addServiceObjective: (objective: Omit<ServiceObjective, 'id' | 'order'>) => void;
  updateServiceObjective: (id: string, updates: Partial<ServiceObjective>) => void;
  deleteServiceObjective: (id: string) => void;
  getObjectivesForCategory: (categoryKey: string) => { value: string; label: string }[];
  getCategoryLabel: (key: string) => string;

  // Hard Drives
  hardDrives: HardDrive[];
  addHardDrive: (hd: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => void;
  updateHardDrive: (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => void;
  deleteHardDrive: (id: string) => void;
  allocateProjectToHD: (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => void;
  removeProjectFromHD: (hdId: string, allocationId: string) => void;

  // Legacy Projects
  legacyProjects: LegacyProject[];
  addLegacyProject: (project: Omit<LegacyProject, 'id' | 'createdAt'>) => LegacyProject;
  deleteLegacyProject: (id: string) => void;
  getLegacyProject: (id: string) => LegacyProject | undefined;
  getHDForBudget: (budgetId: string) => { hdLabel: string; hdId: string } | null;

  // Score History
  scoreHistory: ScoreHistoryEntry[];
  getClientScoreHistory: (clientId: string) => ScoreHistoryEntry[];

  // Assets (Patrimônio)
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Project Management
  projectCards: ProjectCard[];
  projectColumns: ProjectColumn[];
  updateProjectCard: (id: string, updates: Partial<ProjectCard>) => void;
  addProjectColumn: (column: Omit<ProjectColumn, 'id' | 'order'>) => void;
  updateProjectColumn: (id: string, updates: Partial<ProjectColumn>) => void;
  deleteProjectColumn: (id: string) => void;

  // CRM Cards (derived from budgets)
  getCRMCards: () => CRMCard[];
  getCardsByStatus: (status: CRMStatus) => CRMCard[];
  moveCard: (cardId: string, newStatus: CRMStatus) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const { workspace } = useAuth();

  // Clients - now from Supabase
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Still localStorage-based
  const [budgets, setBudgets] = useState<Budget[]>(() => budgetService.getAll());
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(() => settingsService.getKanbanColumns());
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(() => settingsService.getServiceCategories());
  const [serviceObjectives, setServiceObjectives] = useState<ServiceObjective[]>(() => settingsService.getServiceObjectives());
  const [hardDrives, setHardDrives] = useState<HardDrive[]>(() => storageService.getHardDrives());
  const [legacyProjects, setLegacyProjects] = useState<LegacyProject[]>(() => storageService.getLegacyProjects());

  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>(() => {
    const saved = localStorage.getItem('crm_score_history');
    if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    return [];
  });

  const [assets, setAssets] = useState<Asset[]>(() => assetService.getAll());

  const [projectCards, setProjectCards] = useState<ProjectCard[]>(() => {
    const saved = localStorage.getItem('crm_project_cards');
    if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    return [];
  });

  const [projectColumns, setProjectColumns] = useState<ProjectColumn[]>(() => settingsService.getProjectColumns());

  // Load clients from Supabase
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

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  // Persist localStorage-based data
  useEffect(() => { budgetService.persist(budgets); }, [budgets]);
  useEffect(() => { settingsService.persistKanbanColumns(kanbanColumns); }, [kanbanColumns]);
  useEffect(() => { settingsService.persistServiceCategories(serviceCategories); }, [serviceCategories]);
  useEffect(() => { settingsService.persistServiceObjectives(serviceObjectives); }, [serviceObjectives]);
  useEffect(() => { storageService.persistHardDrives(hardDrives); }, [hardDrives]);
  useEffect(() => { storageService.persistLegacyProjects(legacyProjects); }, [legacyProjects]);
  useEffect(() => { localStorage.setItem('crm_score_history', JSON.stringify(scoreHistory)); }, [scoreHistory]);
  useEffect(() => { assetService.persist(assets); }, [assets]);
  useEffect(() => { localStorage.setItem('crm_project_cards', JSON.stringify(projectCards)); }, [projectCards]);
  useEffect(() => { settingsService.persistProjectColumns(projectColumns); }, [projectColumns]);

  // ============= Kanban column functions =============
  const addKanbanColumn = (columnData: Omit<KanbanColumn, 'id' | 'order'>) => {
    const maxOrder = Math.max(...kanbanColumns.map(c => c.order), -1);
    const newColumn: KanbanColumn = { ...columnData, id: uuidv4(), order: maxOrder + 1 };
    setKanbanColumns(prev => [...prev, newColumn]);
  };

  const updateKanbanColumn = (id: string, updates: Partial<KanbanColumn>) => {
    setKanbanColumns(prev => prev.map(col => (col.id === id ? { ...col, ...updates } : col)));
  };

  const deleteKanbanColumn = (id: string) => {
    const column = kanbanColumns.find(c => c.id === id);
    if (column?.isDefault) return;
    const firstColumn = kanbanColumns.find(c => c.order === 0);
    if (firstColumn && column) {
      setBudgets(prev => prev.map(budget =>
        budget.status === column.key ? { ...budget, status: firstColumn.key } : budget
      ));
    }
    setKanbanColumns(prev => prev.filter(col => col.id !== id));
  };

  const reorderKanbanColumns = (newColumns: KanbanColumn[]) => {
    setKanbanColumns(newColumns.map((col, index) => ({ ...col, order: index })));
  };

  const getStatusLabel = (status: CRMStatus): string => {
    const column = kanbanColumns.find(c => c.key === status);
    return column?.label || status;
  };

  // ============= Service Category functions =============
  const addServiceCategory = (categoryData: Omit<ServiceCategory, 'id' | 'order'>) => {
    const maxOrder = Math.max(...serviceCategories.map(c => c.order), -1);
    const newCategory: ServiceCategory = { ...categoryData, id: uuidv4(), order: maxOrder + 1 };
    setServiceCategories(prev => [...prev, newCategory]);
  };

  const updateServiceCategory = (id: string, updates: Partial<ServiceCategory>) => {
    setServiceCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat)));
  };

  const deleteServiceCategory = (id: string) => {
    const category = serviceCategories.find(c => c.id === id);
    if (category?.isDefault) return;
    setServiceObjectives(prev => prev.filter(obj => obj.categoryKey !== category?.key));
    setServiceCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addServiceObjective = (objectiveData: Omit<ServiceObjective, 'id' | 'order'>) => {
    const categoryObjectives = serviceObjectives.filter(o => o.categoryKey === objectiveData.categoryKey);
    const maxOrder = Math.max(...categoryObjectives.map(o => o.order), -1);
    const newObjective: ServiceObjective = { ...objectiveData, id: uuidv4(), order: maxOrder + 1 };
    setServiceObjectives(prev => [...prev, newObjective]);
  };

  const updateServiceObjective = (id: string, updates: Partial<ServiceObjective>) => {
    setServiceObjectives(prev => prev.map(obj => (obj.id === id ? { ...obj, ...updates } : obj)));
  };

  const deleteServiceObjective = (id: string) => {
    setServiceObjectives(prev => prev.filter(obj => obj.id !== id));
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
  const addHardDrive = (hdData: Omit<HardDrive, 'id' | 'projects' | 'createdAt'>) => {
    const newHD: HardDrive = { ...hdData, id: uuidv4(), projects: [], createdAt: new Date() };
    setHardDrives(prev => [...prev, newHD]);
  };

  const updateHardDrive = (id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'>>) => {
    setHardDrives(prev => prev.map(hd => hd.id === id ? { ...hd, ...updates } : hd));
  };

  const deleteHardDrive = (id: string) => {
    setHardDrives(prev => prev.filter(hd => hd.id !== id));
  };

  const allocateProjectToHD = (hdId: string, allocation: Omit<HDProjectAllocation, 'id' | 'allocatedAt'>) => {
    setHardDrives(prev => prev.map(hd => {
      if (hd.id === hdId) {
        const newAllocation: HDProjectAllocation = { ...allocation, id: uuidv4(), allocatedAt: new Date() };
        return { ...hd, projects: [...hd.projects, newAllocation] };
      }
      return hd;
    }));
  };

  const removeProjectFromHD = (hdId: string, allocationId: string) => {
    setHardDrives(prev => prev.map(hd => {
      if (hd.id === hdId) {
        return { ...hd, projects: hd.projects.filter(p => p.id !== allocationId) };
      }
      return hd;
    }));
  };

  // ============= Legacy Project functions =============
  const addLegacyProject = (projectData: Omit<LegacyProject, 'id' | 'createdAt'>): LegacyProject => {
    const newProject: LegacyProject = { ...projectData, id: uuidv4(), createdAt: new Date() };
    setLegacyProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const deleteLegacyProject = (id: string) => {
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
  const addAsset = (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Asset => {
    const newAsset: Asset = { ...assetData, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() };
    setAssets(prev => [...prev, newAsset]);
    return newAsset;
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(asset =>
      asset.id === id ? { ...asset, ...updates, updatedAt: new Date() } : asset
    ));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // ============= Project Management functions =============
  const updateProjectCard = (id: string, updates: Partial<ProjectCard>) => {
    setProjectCards(prev => prev.map(card => card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card));
  };

  const addProjectColumn = (colData: Omit<ProjectColumn, 'id' | 'order'>) => {
    const maxOrder = Math.max(...projectColumns.map(c => c.order), -1);
    setProjectColumns(prev => [...prev, { ...colData, id: uuidv4(), order: maxOrder + 1 }]);
  };

  const updateProjectColumn = (id: string, updates: Partial<ProjectColumn>) => {
    setProjectColumns(prev => prev.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const deleteProjectColumn = (id: string) => {
    const col = projectColumns.find(c => c.id === id);
    if (col?.isDefault) return;
    const firstCol = projectColumns.sort((a, b) => a.order - b.order)[0];
    if (firstCol && col) {
      setProjectCards(prev => prev.map(card => card.status === col.key ? { ...card, status: firstCol.key } : card));
    }
    setProjectColumns(prev => prev.filter(c => c.id !== id));
  };

  // ============= Client functions (now async) =============
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
      .filter(entry => entry.id.startsWith(`${clientId}_`))
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
    if (clients.length === 0) return;
    const clientsToUpdate = new Set<string>();
    budgets.forEach(b => clientsToUpdate.add(b.clientId));
    clientsToUpdate.forEach(clientId => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const scoreBreakdown = calculateClientScore(clientId, budgets);
        if (client.score !== scoreBreakdown.finalScore) {
          const reason = getScoreChangeReason(clientId, scoreBreakdown, client.score);
          const historyEntry: ScoreHistoryEntry = {
            id: `${clientId}_${uuidv4()}`,
            score: scoreBreakdown.finalScore,
            previousScore: client.score,
            reason,
            timestamp: new Date(),
          };
          setScoreHistory(prev => [...prev, historyEntry]);
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
  const generateNextProposalId = (): string => {
    let maxId = 799;
    budgets.forEach(b => {
      const num = parseInt(b.proposalId, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return (maxId + 1).toString().padStart(3, '0');
  };

  const addBudget = (budgetData: Omit<Budget, 'id' | 'proposalId' | 'versions' | 'currentVersion' | 'approvedVersion' | 'approvalDate' | 'finalValue' | 'contractUrl' | 'nfUrl' | 'execution' | 'createdAt' | 'updatedAt'>): Budget => {
    const newBudget: Budget = {
      ...budgetData,
      id: uuidv4(),
      proposalId: generateNextProposalId(),
      projectDescription: budgetData.projectDescription || '',
      includesRawMaterial: budgetData.includesRawMaterial ?? false,
      hasExecutionDate: budgetData.hasExecutionDate ?? false,
      executionStartDate: budgetData.executionStartDate ?? null,
      executionEndDate: budgetData.executionEndDate ?? null,
      location: budgetData.location ?? '',
      versions: [],
      currentVersion: 0,
      approvedVersion: null,
      approvalDate: null,
      finalValue: null,
      contractUrl: null,
      nfUrl: null,
      execution: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setBudgets(prev => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget =>
      budget.id === id ? { ...budget, ...updates, updatedAt: new Date() } : budget
    ));
  };

  const updateBudgetStatus = (id: string, status: CRMStatus) => {
    updateBudget(id, { status });
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  const getBudget = (id: string) => {
    return budgets.find(budget => budget.id === id);
  };

  // Budget Version functions
  const addBudgetVersion = (budgetId: string, versionData: Omit<BudgetVersion, 'id' | 'budgetId' | 'version' | 'createdAt'>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId) {
        const newVersion: BudgetVersion = {
          ...versionData, id: uuidv4(), budgetId, version: budget.currentVersion + 1, createdAt: new Date(),
        };
        return { ...budget, versions: [...budget.versions, newVersion], currentVersion: budget.currentVersion + 1, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const updateBudgetVersion = (budgetId: string, versionId: string, updates: Partial<BudgetVersion>) => {
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

  const approveBudget = (budgetId: string, versionNumber: number) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId) {
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
        return {
          ...budget, status: 'aprovada' as CRMStatus, approvedVersion: versionNumber, approvalDate: new Date(),
          finalValue: approvedVersion?.fullPrice || null, execution, updatedAt: new Date(),
        };
      }
      return budget;
    }));

    // Auto-create project card
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      const alreadyExists = projectCards.some(pc => pc.budgetId === budgetId);
      if (!alreadyExists) {
        const client = clients.find(c => c.id === budget.clientId);
        const approvedVer = budget.versions.find(v => v.version === versionNumber);
        const serviceTypes = approvedVer?.services ? [...new Set(approvedVer.services.map(s => s.serviceType))] : [budget.serviceType];
        const objective = approvedVer?.services?.[0]?.objective || budget.objective || '';
        const firstColKey = [...projectColumns].sort((a, b) => a.order - b.order)[0]?.key || 'planejamento';
        const newProjectCard: ProjectCard = {
          id: uuidv4(), budgetId, proposalId: budget.proposalId, projectName: budget.projectName,
          clientName: client?.companyName || 'Cliente não encontrado', clientId: budget.clientId,
          serviceTypes, objective, status: firstColKey, progress: 0, tasks: [], links: [], comments: [],
          materialLink: '', startDate: budget.executionStartDate, endDate: budget.executionEndDate,
          notes: '', createdAt: new Date(), updatedAt: new Date(),
        };
        setProjectCards(prev => [...prev, newProjectCard]);
      }
    }
  };

  // ============= Execution functions =============
  const updateExecution = (budgetId: string, executionUpdates: Partial<ProjectExecution>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
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
        const budgetedTotal = budget.execution.budgetedTotal;
        const finalValue = budget.finalValue || budgetedTotal;
        const realMargin = finalValue > 0 ? ((finalValue - realTotal) / finalValue) * 100 : 0;
        return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
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
        return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
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
        return { ...budget, execution: { ...budget.execution, services: updatedServices, realTotal, realMargin, updatedAt: new Date() }, updatedAt: new Date() };
      }
      return budget;
    }));
  };

  const finalizeExecution = (budgetId: string, finalReport?: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        return {
          ...budget,
          execution: { ...budget.execution, isFinalized: true, finalizedAt: new Date(), finalReport: finalReport || budget.execution.finalReport, updatedAt: new Date() },
          updatedAt: new Date(),
        };
      }
      return budget;
    }));
  };

  const addDeliveryLink = (budgetId: string, link: Omit<DeliveryLink, 'id' | 'createdAt'>) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        const newLink: DeliveryLink = { ...link, id: uuidv4(), createdAt: new Date() };
        return {
          ...budget,
          execution: { ...budget.execution, deliveryLinks: [...budget.execution.deliveryLinks, newLink], updatedAt: new Date() },
          updatedAt: new Date(),
        };
      }
      return budget;
    }));
  };

  const removeDeliveryLink = (budgetId: string, linkId: string) => {
    setBudgets(prev => prev.map(budget => {
      if (budget.id === budgetId && budget.execution) {
        return {
          ...budget,
          execution: { ...budget.execution, deliveryLinks: budget.execution.deliveryLinks.filter(l => l.id !== linkId), updatedAt: new Date() },
          updatedAt: new Date(),
        };
      }
      return budget;
    }));
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
