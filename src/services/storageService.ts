import { supabase } from '@/integrations/supabase/client';
import { HardDrive, LegacyProject } from '@/types/crm';

function rowToHD(row: any): HardDrive {
  return {
    id: row.id,
    label: row.label,
    capacityGB: Number(row.capacity_gb),
    projects: row.projects || [],
    createdAt: new Date(row.created_at),
  };
}

function rowToLegacy(row: any): LegacyProject {
  return {
    id: row.id,
    projectNumber: row.project_number,
    clientId: row.client_id,
    clientName: row.client_name,
    sizeGB: Number(row.size_gb),
    createdAt: new Date(row.created_at),
  };
}

export const storageService = {
  // Hard Drives
  async getHardDrives(workspaceId: string): Promise<HardDrive[]> {
    const { data, error } = await supabase.from('hard_drives').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (error) throw error;
    return (data || []).map(rowToHD);
  },

  async createHardDrive(workspaceId: string, hd: { label: string; capacityGB: number }): Promise<HardDrive> {
    const { data, error } = await supabase.from('hard_drives').insert({
      workspace_id: workspaceId, label: hd.label, capacity_gb: hd.capacityGB, projects: [],
    }).select().single();
    if (error) throw error;
    return rowToHD(data);
  },

  async updateHardDrive(id: string, updates: Partial<Pick<HardDrive, 'label' | 'capacityGB'> & { projects: any[] }>): Promise<void> {
    const row: any = {};
    if (updates.label !== undefined) row.label = updates.label;
    if (updates.capacityGB !== undefined) row.capacity_gb = updates.capacityGB;
    if (updates.projects !== undefined) row.projects = updates.projects;
    const { error } = await supabase.from('hard_drives').update(row).eq('id', id);
    if (error) throw error;
  },

  async deleteHardDrive(id: string): Promise<void> {
    const { error } = await supabase.from('hard_drives').delete().eq('id', id);
    if (error) throw error;
  },

  // Legacy Projects
  async getLegacyProjects(workspaceId: string): Promise<LegacyProject[]> {
    const { data, error } = await supabase.from('legacy_projects').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (error) throw error;
    return (data || []).map(rowToLegacy);
  },

  async createLegacyProject(workspaceId: string, project: Omit<LegacyProject, 'id' | 'createdAt'>): Promise<LegacyProject> {
    const { data, error } = await supabase.from('legacy_projects').insert({
      workspace_id: workspaceId, project_number: project.projectNumber, client_id: project.clientId,
      client_name: project.clientName, size_gb: project.sizeGB,
    }).select().single();
    if (error) throw error;
    return rowToLegacy(data);
  },

  async deleteLegacyProject(id: string): Promise<void> {
    const { error } = await supabase.from('legacy_projects').delete().eq('id', id);
    if (error) throw error;
  },
};
