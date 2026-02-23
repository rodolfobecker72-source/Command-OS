import { supabase } from '@/integrations/supabase/client';
import { ProspectionLead } from '@/types/prospection';

function rowToLead(row: any): ProspectionLead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactRole: row.contact_role,
    phone: row.phone,
    email: row.email,
    city: row.city,
    origin: row.origin,
    segment: row.segment,
    acquisitionType: row.acquisition_type,
    estimatedPotential: Number(row.estimated_potential),
    temperature: row.temperature,
    funnelStatus: row.funnel_status,
    prospectionResponsible: row.prospection_responsible,
    closingResponsible: row.closing_responsible,
    lastContactDate: row.last_contact_date,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    priority: row.priority,
    strategicNotes: row.strategic_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function leadToRow(data: Partial<ProspectionLead>) {
  const row: any = {};
  if (data.companyName !== undefined) row.company_name = data.companyName;
  if (data.contactName !== undefined) row.contact_name = data.contactName;
  if (data.contactRole !== undefined) row.contact_role = data.contactRole;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email;
  if (data.city !== undefined) row.city = data.city;
  if (data.origin !== undefined) row.origin = data.origin;
  if (data.segment !== undefined) row.segment = data.segment;
  if (data.acquisitionType !== undefined) row.acquisition_type = data.acquisitionType;
  if (data.estimatedPotential !== undefined) row.estimated_potential = data.estimatedPotential;
  if (data.temperature !== undefined) row.temperature = data.temperature;
  if (data.funnelStatus !== undefined) row.funnel_status = data.funnelStatus;
  if (data.prospectionResponsible !== undefined) row.prospection_responsible = data.prospectionResponsible;
  if (data.closingResponsible !== undefined) row.closing_responsible = data.closingResponsible;
  if (data.lastContactDate !== undefined) row.last_contact_date = data.lastContactDate;
  if (data.nextAction !== undefined) row.next_action = data.nextAction;
  if (data.nextActionDate !== undefined) row.next_action_date = data.nextActionDate;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.strategicNotes !== undefined) row.strategic_notes = data.strategicNotes;
  return row;
}

export const prospectionService = {
  async getAll(workspaceId: string): Promise<ProspectionLead[]> {
    const { data, error } = await supabase
      .from('prospection_leads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToLead);
  },

  async getById(id: string): Promise<ProspectionLead | null> {
    const { data, error } = await supabase
      .from('prospection_leads')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToLead(data);
  },

  async create(workspaceId: string, data: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProspectionLead> {
    const row = { ...leadToRow(data), workspace_id: workspaceId };
    const { data: inserted, error } = await supabase
      .from('prospection_leads')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToLead(inserted);
  },

  async update(id: string, updates: Partial<ProspectionLead>): Promise<ProspectionLead | null> {
    const row = leadToRow(updates);
    const { data, error } = await supabase
      .from('prospection_leads')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) return null;
    return rowToLead(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prospection_leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
