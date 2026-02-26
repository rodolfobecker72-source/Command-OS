// Lead Origin Types
export type LeadOrigin = 
  | 'cliente_antigo'
  | 'indicacao'
  | 'organico'
  | 'site'
  | 'google'
  | 'trafego_pago'
  | 'prospeccao_ativa'
  | 'evento_feira'
  | 'parceria';

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  cliente_antigo: 'Cliente antigo',
  indicacao: 'Indicação',
  organico: 'Orgânico (Redes Sociais)',
  site: 'Site',
  google: 'Google',
  trafego_pago: 'Tráfego Pago',
  prospeccao_ativa: 'Prospecção Ativa',
  evento_feira: 'Evento / Feira',
  parceria: 'Parceria',
};

// Service Type (now dynamic, kept as string for flexibility)
export type ServiceType = string;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  CINE: 'CINE',
  FOTO: 'FOTO',
  MOBILE: 'MOBILE',
};

// Service Category Interface (dynamic)
export interface ServiceCategory {
  id: string;
  key: string;
  label: string;
  order: number;
  isDefault?: boolean;
}

// Service Objective Interface (dynamic)
export interface ServiceObjective {
  id: string;
  categoryKey: string;
  key: string;
  label: string;
  order: number;
}

// Default service categories
export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: '1', key: 'CINE', label: 'CINE', order: 0, isDefault: true },
  { id: '2', key: 'FOTO', label: 'FOTO', order: 1, isDefault: true },
  { id: '3', key: 'MOBILE', label: 'MOBILE', order: 2, isDefault: true },
];

// Default service objectives
export const DEFAULT_SERVICE_OBJECTIVES: ServiceObjective[] = [
  // CINE
  { id: 'o1', categoryKey: 'CINE', key: 'conteudo_interno', label: 'Conteúdo Interno', order: 0 },
  { id: 'o2', categoryKey: 'CINE', key: 'filme_institucional', label: 'Filme Institucional', order: 1 },
  { id: 'o3', categoryKey: 'CINE', key: 'producao_corporativa', label: 'Produção Corporativa', order: 2 },
  { id: 'o4', categoryKey: 'CINE', key: 'cobertura_evento', label: 'Cobertura de Evento', order: 3 },
  { id: 'o5', categoryKey: 'CINE', key: 'conteudo_rede_social', label: 'Conteúdo para Redes Sociais', order: 4 },
  { id: 'o6', categoryKey: 'CINE', key: 'treinamento', label: 'Treinamento', order: 5 },
  { id: 'o7', categoryKey: 'CINE', key: 'footage', label: 'Footage', order: 6 },
  { id: 'o8', categoryKey: 'CINE', key: 'tv_ancine', label: 'TV / Ancine', order: 7 },
  // FOTO
  { id: 'o9', categoryKey: 'FOTO', key: 'conteudo_interno', label: 'Conteúdo Interno', order: 0 },
  { id: 'o10', categoryKey: 'FOTO', key: 'fotos', label: 'Fotos Geral', order: 1 },
  { id: 'o11', categoryKey: 'FOTO', key: 'creator_studio', label: 'Creator Studio', order: 2 },
  { id: 'o12', categoryKey: 'FOTO', key: 'producao_corporativa', label: 'Produção Corporativa', order: 3 },
  { id: 'o13', categoryKey: 'FOTO', key: 'cobertura_evento', label: 'Cobertura de Evento', order: 4 },
  { id: 'o14', categoryKey: 'FOTO', key: 'conteudo_rede_social', label: 'Conteúdo para Redes Sociais', order: 5 },
  // MOBILE
  { id: 'o15', categoryKey: 'MOBILE', key: 'conteudo_interno', label: 'Conteúdo Interno', order: 0 },
  { id: 'o16', categoryKey: 'MOBILE', key: 'producao_corporativa', label: 'Produção Corporativa', order: 1 },
  { id: 'o17', categoryKey: 'MOBILE', key: 'cobertura_evento', label: 'Cobertura de Evento', order: 2 },
  { id: 'o18', categoryKey: 'MOBILE', key: 'conteudo_rede_social', label: 'Conteúdo para Redes Sociais', order: 3 },
  { id: 'o19', categoryKey: 'MOBILE', key: 'footage', label: 'Footage', order: 4 },
];

// Project Objective (now dynamic string)
export type ProjectObjective = string;

// Backward-compatible OBJECTIVES_BY_SERVICE (derived from defaults)
export function getObjectivesByService(objectives: ServiceObjective[]): Record<string, { value: string; label: string }[]> {
  const result: Record<string, { value: string; label: string }[]> = {};
  objectives.forEach(obj => {
    if (!result[obj.categoryKey]) result[obj.categoryKey] = [];
    result[obj.categoryKey].push({ value: obj.key, label: obj.label });
  });
  return result;
}

// Legacy export for backward compatibility
export const OBJECTIVES_BY_SERVICE = getObjectivesByService(DEFAULT_SERVICE_OBJECTIVES);

// CRM Status (Budget/Proposal Status) - Dynamic
export type CRMStatus = string;

// Kanban Column Interface
export interface KanbanColumn {
  id: string;
  key: string; // Unique key for the status
  label: string;
  color: string;
  order: number;
  isDefault?: boolean; // System columns that can't be deleted
}

// Default columns
export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: '1', key: 'oportunidade_mapeada', label: 'Oportunidade mapeada', color: 'bg-info/10 text-info border-info/20', order: 0, isDefault: true },
  { id: '2', key: 'fazer_proposta', label: 'Fazer proposta', color: 'bg-purple-100 text-purple-700 border-purple-200', order: 1 },
  { id: '3', key: 'pronta_enviar', label: 'Pronta p/ enviar', color: 'bg-warning/10 text-warning border-warning/20', order: 2 },
  { id: '4', key: 'proposta_enviada', label: 'Proposta enviada', color: 'bg-accent/10 text-accent border-accent/20', order: 3 },
  { id: '5', key: 'fazer_followup', label: 'Fazer follow-up', color: 'bg-orange-100 text-orange-700 border-orange-200', order: 4 },
  { id: '6', key: 'nao_aprovada', label: 'Não-aprovada', color: 'bg-destructive/10 text-destructive border-destructive/20', order: 5, isDefault: true },
  { id: '7', key: 'aprovada', label: 'Aprovada', color: 'bg-success/10 text-success border-success/20', order: 6, isDefault: true },
];

// Helper to get status labels from columns
export function getStatusLabels(columns: KanbanColumn[]): Record<string, string> {
  return columns.reduce((acc, col) => {
    acc[col.key] = col.label;
    return acc;
  }, {} as Record<string, string>);
}

// Legacy exports for backward compatibility
export const CRM_STATUS_LABELS: Record<string, string> = {
  oportunidade_mapeada: 'Oportunidade mapeada',
  fazer_proposta: 'Oport. / Fazer proposta',
  pronta_enviar: 'Pronta p/ enviar ou reunião',
  proposta_enviada: 'Proposta enviada',
  fazer_followup: 'Fazer follow-up',
  nao_aprovada: 'Não-aprovada',
  aprovada: 'Aprovada',
};

export const CRM_STATUS_COLORS: Record<string, string> = {
  oportunidade_mapeada: 'bg-status-opportunity',
  fazer_proposta: 'bg-status-proposal',
  pronta_enviar: 'bg-status-ready',
  proposta_enviada: 'bg-status-sent',
  fazer_followup: 'bg-status-followup',
  nao_aprovada: 'bg-status-rejected',
  aprovada: 'bg-status-approved',
};

// Payment Status
export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

// Client Interface
export interface Client {
  id: string;
  companyName: string;
  cnpj: string;
  responsiblePerson: string;
  email: string;
  phone: string;
  leadOrigin: LeadOrigin;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cost Item Interface
export interface CostItem {
  id: string;
  description: string;
  quantity: number;
  unitValue: number;
  value: number; // quantity * unitValue (computed)
  paymentStatus: PaymentStatus;
  paymentDate: Date | null;
}

// Execution Cost Item (for real execution tracking)
export interface ExecutionCostItem extends CostItem {
  budgetedValue: number; // Original budgeted value
  realValue: number; // Real value paid
  supplier?: string; // Supplier/person who executed this cost
}

// Service Item Interface (for budget with multiple services)
export interface ServiceItem {
  id: string;
  serviceType: ServiceType;
  objective: string;
  description: string;
  costs: CostItem[];
  fixedCostPercentage: number;
  nfCostPercentage: number;
  targetMargin: number;
}

// Budget Version Interface
export interface BudgetVersion {
  id: string;
  budgetId: string;
  version: number;
  services: ServiceItem[]; // Services with individual cost sheets
  operationalCosts: CostItem[]; // Operational costs (logistics, accommodation, etc.)
  costs: CostItem[]; // Legacy: flat list of costs (deprecated)
  productionCost: number;
  fixedCostPercentage: number; // Default 20%
  nfCostPercentage: number; // Default 13%
  totalCost: number;
  fullPrice: number;
  discount4Price: number;
  discount5Price: number;
  margin: number;
  reason: string; // Reason for new version
  isRejected?: boolean; // Whether this version was rejected
  rejectionReason?: string; // Reason for rejection
  createdAt: Date;
}

// Execution Service Item
export interface ExecutionServiceItem {
  id: string;
  serviceType: ServiceType;
  objective: string;
  description: string;
  costs: ExecutionCostItem[];
  extraCosts: ExecutionCostItem[]; // Extra costs not in original budget
  budgetedTotal: number; // Production cost budgeted
  realTotal: number; // Production cost real
  budgetedFinalValue: number; // Final value that was budgeted for this service
  finalValue: number; // Final value charged to client for this service
  nfTaxProportion?: number; // Proportional NF tax for this service
}

// Delivery Link Interface
export interface DeliveryLink {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

// Project Execution Interface
export interface ProjectExecution {
  id: string;
  budgetId: string;
  approvedVersionId: string;
  executor: string; // Who executed the project
  nfTaxValue: number; // Invoice tax value distributed proportionally
  services: ExecutionServiceItem[];
  operationalCosts: ExecutionCostItem[]; // Operational costs for execution
  extraOperationalCosts: ExecutionCostItem[]; // Extra operational costs not in original budget
  budgetedTotal: number;
  realTotal: number;
  realMargin: number;
  isFinalized: boolean; // Whether execution is finalized/consolidated
  finalizedAt: Date | null; // When execution was finalized
  deliveryLinks: DeliveryLink[]; // Links to delivery materials
  finalReport?: string; // Final execution report/notes
  createdAt: Date;
  updatedAt: Date;
}

// Budget Interface
export interface Budget {
  id: string;
  proposalId: string; // User-defined identifier
  projectName: string;
  projectDescription: string; // General project description
  clientId: string;
  serviceType: ServiceType;
  objective: string;
  description: string;
  paymentTerms: string;
  includesTax: boolean; // Imposto incluso
  includesLogistics: boolean; // Custos com logística inclusa
  includesAccommodation: boolean; // Custos com hospedagem incluso
  includesMeals: boolean; // Alimentação da equipe inclusa
  includesRawMaterial: boolean; // Material bruto incluso na entrega
  includesTechnicalVisit: boolean; // Visita técnica inclusa
  hasExecutionDate: boolean; // Se tem data para execução definida
  executionStartDate: Date | null; // Data início da execução
  executionEndDate: Date | null; // Data fim da execução (opcional, para período)
  location: string; // Local do projeto
  status: CRMStatus;
  versions: BudgetVersion[];
  currentVersion: number;
  approvedVersion: number | null;
  approvalDate: Date | null;
  finalValue: number | null;
  contractUrl: string | null;
  nfUrl: string | null;
  execution: ProjectExecution | null; // Execution tracking when approved
  createdAt: Date;
  updatedAt: Date;
}

// CRM Card (for Kanban view)
export interface CRMCard {
  id: string;
  budgetId: string;
  projectName: string;
  clientName: string;
  clientId: string;
  serviceType: ServiceType;
  serviceTypes: ServiceType[]; // All service types in the budget
  value: number | null;
  status: CRMStatus;
  clientScore: number;
  currentVersion: number;
}

// Utility functions
export function getScoreClass(score: number): string {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}


// Calculate service totals
export function calculateServiceTotals(service: ServiceItem) {
  const productionCost = service.costs.reduce((sum, cost) => sum + cost.value, 0);
  const fixedCost = productionCost * (service.fixedCostPercentage / 100);
  const nfCost = productionCost * (service.nfCostPercentage / 100);
  const totalCost = productionCost + fixedCost + nfCost;
  
  const finalValue = service.targetMargin > 0 && service.targetMargin < 100
    ? totalCost / (1 - service.targetMargin / 100)
    : totalCost;

  return {
    productionCost,
    fixedCost,
    nfCost,
    totalCost,
    finalValue,
    margin: service.targetMargin,
  };
}

// ============= HD / Media Storage =============

export interface LegacyProject {
  id: string;
  projectNumber: string;
  clientId: string;
  clientName: string; // cached for display
  sizeGB: number;
  createdAt: Date;
}

export interface HDProjectAllocation {
  id: string;
  budgetId?: string;
  legacyProjectId?: string;
  sizeGB: number;
  allocatedAt: Date;
}

export interface HardDrive {
  id: string;
  label: string; // e.g. "HD-001"
  capacityGB: number;
  projects: HDProjectAllocation[];
  createdAt: Date;
}

// ============= Assets / Patrimônio =============

export interface Asset {
  id: string;
  name: string;
  description: string;
  value: number;
  serialNumber: string; // Optional, can be empty
  heroAssetNumber: string; // Nº Patrimônio HERO - Optional
  photo: string; // base64 or URL
  referenceLink: string; // Optional
  assignedTo: string; // Free text for now
  createdAt: Date;
  updatedAt: Date;
}

// ============= Project Management / Gestão de Projetos =============

export interface ProjectColumn {
  id: string;
  key: string;
  label: string;
  color: string; // dot color class
  order: number;
  isDefault?: boolean;
}

export const DEFAULT_PROJECT_COLUMNS: ProjectColumn[] = [
  { id: 'pc1', key: 'planejamento', label: 'Planejamento', color: 'bg-warning', order: 0, isDefault: true },
  { id: 'pc2', key: 'em_andamento', label: 'Em andamento', color: 'bg-info', order: 1, isDefault: true },
  { id: 'pc3', key: 'pausado', label: 'Pausado', color: 'bg-muted-foreground', order: 2 },
  { id: 'pc4', key: 'concluido', label: 'Concluído', color: 'bg-success', order: 3, isDefault: true },
];

export interface ProjectTask {
  id: string;
  title: string;
  responsible: string;
  dueDate: Date | null;
  status: 'planejado' | 'executando' | 'concluido';
}

export interface ProjectLink {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

export interface ProjectComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface ProjectCard {
  id: string;
  budgetId: string;
  proposalId: string;
  projectName: string;
  clientName: string;
  clientId: string;
  serviceTypes: ServiceType[];
  objective: string;
  status: string; // ProjectColumn key
  progress: number; // 0-100
  tasks: ProjectTask[];
  links: ProjectLink[];
  comments: ProjectComment[];
  materialLink: string;
  startDate: Date | null;
  endDate: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
