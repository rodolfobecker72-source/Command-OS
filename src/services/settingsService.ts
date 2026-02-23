import { supabase } from '@/integrations/supabase/client';
import {
  KanbanColumn,
  DEFAULT_KANBAN_COLUMNS,
  ServiceCategory,
  ServiceObjective,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_SERVICE_OBJECTIVES,
  ProjectColumn,
  DEFAULT_PROJECT_COLUMNS,
} from '@/types/crm';

// Helper mappers
function rowToKanbanColumn(row: any): KanbanColumn {
  return { id: row.id, key: row.key, label: row.label, color: row.color, order: row.order, isDefault: row.is_default };
}
function rowToServiceCategory(row: any): ServiceCategory {
  return { id: row.id, key: row.key, label: row.label, order: row.order, isDefault: row.is_default };
}
function rowToServiceObjective(row: any): ServiceObjective {
  return { id: row.id, categoryKey: row.category_key, key: row.key, label: row.label, order: row.order };
}
function rowToProjectColumn(row: any): ProjectColumn {
  return { id: row.id, key: row.key, label: row.label, color: row.color, order: row.order, isDefault: row.is_default };
}

async function seedDefaults<T>(
  table: 'kanban_columns' | 'service_categories' | 'service_objectives' | 'project_columns',
  workspaceId: string,
  defaults: any[],
  mapFn: (row: any) => T,
  toRowFn: (item: any, wsId: string) => any,
): Promise<T[]> {
  const rows = defaults.map(d => toRowFn(d, workspaceId));
  const { data, error } = await supabase.from(table).insert(rows as any).select();
  if (error) throw error;
  return (data || []).map(mapFn);
}

export const settingsService = {
  // Kanban Columns
  async getKanbanColumns(workspaceId: string): Promise<KanbanColumn[]> {
    const { data, error } = await supabase.from('kanban_columns').select('*').eq('workspace_id', workspaceId).order('order');
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToKanbanColumn);
    // Seed defaults
    return seedDefaults('kanban_columns', workspaceId, DEFAULT_KANBAN_COLUMNS, rowToKanbanColumn,
      (col, wsId) => ({ workspace_id: wsId, key: col.key, label: col.label, color: col.color, order: col.order, is_default: col.isDefault || false }));
  },
  async upsertKanbanColumn(workspaceId: string, col: KanbanColumn): Promise<KanbanColumn> {
    const row = { id: col.id, workspace_id: workspaceId, key: col.key, label: col.label, color: col.color, order: col.order, is_default: col.isDefault || false };
    const { data, error } = await supabase.from('kanban_columns').upsert(row).select().single();
    if (error) throw error;
    return rowToKanbanColumn(data);
  },
  async deleteKanbanColumn(id: string): Promise<void> {
    const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
    if (error) throw error;
  },
  async persistKanbanColumns(workspaceId: string, columns: KanbanColumn[]): Promise<void> {
    // Delete all then re-insert
    await supabase.from('kanban_columns').delete().eq('workspace_id', workspaceId);
    if (columns.length > 0) {
      const rows = columns.map(col => ({
        id: col.id, workspace_id: workspaceId, key: col.key, label: col.label, color: col.color, order: col.order, is_default: col.isDefault || false,
      }));
      const { error } = await supabase.from('kanban_columns').insert(rows);
      if (error) throw error;
    }
  },

  // Service Categories
  async getServiceCategories(workspaceId: string): Promise<ServiceCategory[]> {
    const { data, error } = await supabase.from('service_categories').select('*').eq('workspace_id', workspaceId).order('order');
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToServiceCategory);
    return seedDefaults('service_categories', workspaceId, DEFAULT_SERVICE_CATEGORIES, rowToServiceCategory,
      (cat, wsId) => ({ workspace_id: wsId, key: cat.key, label: cat.label, order: cat.order, is_default: cat.isDefault || false }));
  },
  async persistServiceCategories(workspaceId: string, categories: ServiceCategory[]): Promise<void> {
    await supabase.from('service_categories').delete().eq('workspace_id', workspaceId);
    if (categories.length > 0) {
      const rows = categories.map(cat => ({
        id: cat.id, workspace_id: workspaceId, key: cat.key, label: cat.label, order: cat.order, is_default: cat.isDefault || false,
      }));
      const { error } = await supabase.from('service_categories').insert(rows);
      if (error) throw error;
    }
  },

  // Service Objectives
  async getServiceObjectives(workspaceId: string): Promise<ServiceObjective[]> {
    const { data, error } = await supabase.from('service_objectives').select('*').eq('workspace_id', workspaceId).order('order');
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToServiceObjective);
    return seedDefaults('service_objectives', workspaceId, DEFAULT_SERVICE_OBJECTIVES, rowToServiceObjective,
      (obj, wsId) => ({ workspace_id: wsId, category_key: obj.categoryKey, key: obj.key, label: obj.label, order: obj.order }));
  },
  async persistServiceObjectives(workspaceId: string, objectives: ServiceObjective[]): Promise<void> {
    await supabase.from('service_objectives').delete().eq('workspace_id', workspaceId);
    if (objectives.length > 0) {
      const rows = objectives.map(obj => ({
        id: obj.id, workspace_id: workspaceId, category_key: obj.categoryKey, key: obj.key, label: obj.label, order: obj.order,
      }));
      const { error } = await supabase.from('service_objectives').insert(rows);
      if (error) throw error;
    }
  },

  // Project Columns
  async getProjectColumns(workspaceId: string): Promise<ProjectColumn[]> {
    const { data, error } = await supabase.from('project_columns').select('*').eq('workspace_id', workspaceId).order('order');
    if (error) throw error;
    if (data && data.length > 0) return data.map(rowToProjectColumn);
    return seedDefaults('project_columns', workspaceId, DEFAULT_PROJECT_COLUMNS, rowToProjectColumn,
      (col, wsId) => ({ workspace_id: wsId, key: col.key, label: col.label, color: col.color, order: col.order, is_default: col.isDefault || false }));
  },
  async persistProjectColumns(workspaceId: string, columns: ProjectColumn[]): Promise<void> {
    await supabase.from('project_columns').delete().eq('workspace_id', workspaceId);
    if (columns.length > 0) {
      const rows = columns.map(col => ({
        id: col.id, workspace_id: workspaceId, key: col.key, label: col.label, color: col.color, order: col.order, is_default: col.isDefault || false,
      }));
      const { error } = await supabase.from('project_columns').insert(rows);
      if (error) throw error;
    }
  },
};
