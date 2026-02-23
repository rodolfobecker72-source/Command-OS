import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/crm';

// Helper to map DB row to Client type
function rowToClient(row: any): Client {
  return {
    id: row.id,
    companyName: row.company_name,
    cnpj: row.cnpj,
    responsiblePerson: row.responsible_person,
    email: row.email,
    phone: row.phone,
    leadOrigin: row.lead_origin,
    score: row.score,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Helper to map Client to DB insert/update
function clientToRow(data: Partial<Client>) {
  const row: any = {};
  if (data.companyName !== undefined) row.company_name = data.companyName;
  if (data.cnpj !== undefined) row.cnpj = data.cnpj;
  if (data.responsiblePerson !== undefined) row.responsible_person = data.responsiblePerson;
  if (data.email !== undefined) row.email = data.email;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.leadOrigin !== undefined) row.lead_origin = data.leadOrigin;
  if (data.score !== undefined) row.score = data.score;
  return row;
}

export const clientService = {
  async getAll(workspaceId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToClient);
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return rowToClient(data);
  },

  async create(workspaceId: string, data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const row = { ...clientToRow(data), workspace_id: workspaceId };
    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToClient(inserted);
  },

  async update(id: string, updates: Partial<Client>): Promise<void> {
    const row = clientToRow(updates);
    const { error } = await supabase
      .from('clients')
      .update(row)
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
