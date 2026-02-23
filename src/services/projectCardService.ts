import { supabase } from '@/integrations/supabase/client';
import { ProjectCard } from '@/types/crm';

function rowToCard(row: any): ProjectCard {
  return {
    id: row.id,
    budgetId: row.budget_id,
    proposalId: row.proposal_id,
    projectName: row.project_name,
    clientName: row.client_name,
    clientId: row.client_id,
    serviceTypes: row.service_types || [],
    objective: row.objective,
    status: row.status,
    progress: row.progress,
    tasks: row.tasks || [],
    links: row.links || [],
    comments: row.comments || [],
    materialLink: row.material_link,
    startDate: row.start_date ? new Date(row.start_date) : null,
    endDate: row.end_date ? new Date(row.end_date) : null,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function cardToRow(card: Partial<ProjectCard>, workspaceId?: string) {
  const row: any = {};
  if (workspaceId) row.workspace_id = workspaceId;
  if (card.budgetId !== undefined) row.budget_id = card.budgetId;
  if (card.proposalId !== undefined) row.proposal_id = card.proposalId;
  if (card.projectName !== undefined) row.project_name = card.projectName;
  if (card.clientName !== undefined) row.client_name = card.clientName;
  if (card.clientId !== undefined) row.client_id = card.clientId;
  if (card.serviceTypes !== undefined) row.service_types = card.serviceTypes;
  if (card.objective !== undefined) row.objective = card.objective;
  if (card.status !== undefined) row.status = card.status;
  if (card.progress !== undefined) row.progress = card.progress;
  if (card.tasks !== undefined) row.tasks = card.tasks;
  if (card.links !== undefined) row.links = card.links;
  if (card.comments !== undefined) row.comments = card.comments;
  if (card.materialLink !== undefined) row.material_link = card.materialLink;
  if (card.startDate !== undefined) row.start_date = card.startDate ? new Date(card.startDate).toISOString() : null;
  if (card.endDate !== undefined) row.end_date = card.endDate ? new Date(card.endDate).toISOString() : null;
  if (card.notes !== undefined) row.notes = card.notes;
  return row;
}

export const projectCardService = {
  async getAll(workspaceId: string): Promise<ProjectCard[]> {
    const { data, error } = await supabase.from('project_cards').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToCard);
  },

  async create(workspaceId: string, card: Omit<ProjectCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectCard> {
    const row = cardToRow(card, workspaceId);
    const { data, error } = await supabase.from('project_cards').insert(row).select().single();
    if (error) throw error;
    return rowToCard(data);
  },

  async update(id: string, updates: Partial<ProjectCard>): Promise<void> {
    const row = cardToRow(updates);
    const { error } = await supabase.from('project_cards').update(row).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('project_cards').delete().eq('id', id);
    if (error) throw error;
  },
};
