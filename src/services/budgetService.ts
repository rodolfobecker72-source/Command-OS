import { supabase } from '@/integrations/supabase/client';
import { Budget, BudgetVersion } from '@/types/crm';

// Helper to convert DB row to Budget (without versions - those come separately)
function rowToBudget(row: any, versions: BudgetVersion[] = []): Budget {
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
    hasExecutionDate: row.has_execution_date,
    executionStartDate: row.execution_start_date ? new Date(row.execution_start_date) : null,
    executionEndDate: row.execution_end_date ? new Date(row.execution_end_date) : null,
    location: row.location,
    status: row.status,
    currentVersion: row.current_version,
    approvedVersion: row.approved_version,
    approvalDate: row.approval_date ? new Date(row.approval_date) : null,
    finalValue: row.final_value != null ? Number(row.final_value) : null,
    contractUrl: row.contract_url,
    nfUrl: row.nf_url,
    execution: row.execution || null,
    versions,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function versionRowToVersion(row: any): BudgetVersion {
  return {
    id: row.id,
    budgetId: row.budget_id,
    version: row.version,
    services: row.services || [],
    operationalCosts: row.operational_costs || [],
    costs: row.costs || [],
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

function budgetToRow(budget: Partial<Budget>, workspaceId?: string) {
  const row: any = {};
  if (workspaceId) row.workspace_id = workspaceId;
  if (budget.proposalId !== undefined) row.proposal_id = budget.proposalId;
  if (budget.projectName !== undefined) row.project_name = budget.projectName;
  if (budget.projectDescription !== undefined) row.project_description = budget.projectDescription;
  if (budget.clientId !== undefined) row.client_id = budget.clientId;
  if (budget.serviceType !== undefined) row.service_type = budget.serviceType;
  if (budget.objective !== undefined) row.objective = budget.objective;
  if (budget.description !== undefined) row.description = budget.description;
  if (budget.paymentTerms !== undefined) row.payment_terms = budget.paymentTerms;
  if (budget.includesTax !== undefined) row.includes_tax = budget.includesTax;
  if (budget.includesLogistics !== undefined) row.includes_logistics = budget.includesLogistics;
  if (budget.includesAccommodation !== undefined) row.includes_accommodation = budget.includesAccommodation;
  if (budget.includesMeals !== undefined) row.includes_meals = budget.includesMeals;
  if (budget.includesRawMaterial !== undefined) row.includes_raw_material = budget.includesRawMaterial;
  if (budget.hasExecutionDate !== undefined) row.has_execution_date = budget.hasExecutionDate;
  if (budget.executionStartDate !== undefined) row.execution_start_date = budget.executionStartDate ? new Date(budget.executionStartDate).toISOString() : null;
  if (budget.executionEndDate !== undefined) row.execution_end_date = budget.executionEndDate ? new Date(budget.executionEndDate).toISOString() : null;
  if (budget.location !== undefined) row.location = budget.location;
  if (budget.status !== undefined) row.status = budget.status;
  if (budget.currentVersion !== undefined) row.current_version = budget.currentVersion;
  if (budget.approvedVersion !== undefined) row.approved_version = budget.approvedVersion;
  if (budget.approvalDate !== undefined) row.approval_date = budget.approvalDate ? new Date(budget.approvalDate).toISOString() : null;
  if (budget.finalValue !== undefined) row.final_value = budget.finalValue;
  if (budget.contractUrl !== undefined) row.contract_url = budget.contractUrl;
  if (budget.nfUrl !== undefined) row.nf_url = budget.nfUrl;
  if (budget.execution !== undefined) row.execution = budget.execution;
  return row;
}

function versionToRow(version: Partial<BudgetVersion>, workspaceId?: string, budgetId?: string) {
  const row: any = {};
  if (workspaceId) row.workspace_id = workspaceId;
  if (budgetId) row.budget_id = budgetId;
  if (version.version !== undefined) row.version = version.version;
  if (version.services !== undefined) row.services = version.services;
  if (version.operationalCosts !== undefined) row.operational_costs = version.operationalCosts;
  if (version.costs !== undefined) row.costs = version.costs;
  if (version.productionCost !== undefined) row.production_cost = version.productionCost;
  if (version.fixedCostPercentage !== undefined) row.fixed_cost_percentage = version.fixedCostPercentage;
  if (version.nfCostPercentage !== undefined) row.nf_cost_percentage = version.nfCostPercentage;
  if (version.totalCost !== undefined) row.total_cost = version.totalCost;
  if (version.fullPrice !== undefined) row.full_price = version.fullPrice;
  if (version.discount4Price !== undefined) row.discount4_price = version.discount4Price;
  if (version.discount5Price !== undefined) row.discount5_price = version.discount5Price;
  if (version.margin !== undefined) row.margin = version.margin;
  if (version.reason !== undefined) row.reason = version.reason;
  if (version.isRejected !== undefined) row.is_rejected = version.isRejected;
  if (version.rejectionReason !== undefined) row.rejection_reason = version.rejectionReason;
  return row;
}

export const budgetService = {
  async getAll(workspaceId: string): Promise<Budget[]> {
    const { data: budgetRows, error: bErr } = await supabase
      .from('budgets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (bErr) throw bErr;
    if (!budgetRows || budgetRows.length === 0) return [];

    const { data: versionRows, error: vErr } = await supabase
      .from('budget_versions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: true });
    if (vErr) throw vErr;

    const versionsByBudget: Record<string, BudgetVersion[]> = {};
    (versionRows || []).forEach(row => {
      const v = versionRowToVersion(row);
      if (!versionsByBudget[v.budgetId]) versionsByBudget[v.budgetId] = [];
      versionsByBudget[v.budgetId].push(v);
    });

    return budgetRows.map(row => rowToBudget(row, versionsByBudget[row.id] || []));
  },

  async create(workspaceId: string, budget: Omit<Budget, 'id' | 'versions' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const row = budgetToRow(budget, workspaceId);
    const { data, error } = await supabase.from('budgets').insert(row).select().single();
    if (error) throw error;
    return rowToBudget(data, []);
  },

  async update(id: string, updates: Partial<Budget>): Promise<void> {
    const row = budgetToRow(updates);
    const { error } = await supabase.from('budgets').update(row).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  async addVersion(workspaceId: string, budgetId: string, version: Omit<BudgetVersion, 'id' | 'budgetId' | 'createdAt'>): Promise<BudgetVersion> {
    const row = versionToRow(version, workspaceId, budgetId);
    const { data, error } = await supabase.from('budget_versions').insert(row).select().single();
    if (error) throw error;
    return versionRowToVersion(data);
  },

  async updateVersion(versionId: string, updates: Partial<BudgetVersion>): Promise<void> {
    const row = versionToRow(updates);
    const { error } = await supabase.from('budget_versions').update(row).eq('id', versionId);
    if (error) throw error;
  },

  async getNextProposalId(workspaceId: string): Promise<string> {
    const { data, error } = await supabase
      .from('budgets')
      .select('proposal_id')
      .eq('workspace_id', workspaceId)
      .order('proposal_id', { ascending: false })
      .limit(100);
    if (error) throw error;
    let maxId = 799;
    (data || []).forEach(row => {
      const num = parseInt(row.proposal_id, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    });
    return (maxId + 1).toString().padStart(3, '0');
  },
};
