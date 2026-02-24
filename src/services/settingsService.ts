import { v4 as uuidv4 } from 'uuid';
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

const KEYS = {
  kanbanColumns: 'crm_kanban_columns',
  serviceCategories: 'crm_service_categories',
  serviceObjectives: 'crm_service_objectives',
  projectColumns: 'crm_project_columns',
};

function loadOrDefault<T>(key: string, defaults: T): T {
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaults; }
  }
  return defaults;
}

export const settingsService = {
  // Kanban Columns
  getKanbanColumns(): KanbanColumn[] {
    return loadOrDefault(KEYS.kanbanColumns, DEFAULT_KANBAN_COLUMNS);
  },
  persistKanbanColumns(columns: KanbanColumn[]): void {
    localStorage.setItem(KEYS.kanbanColumns, JSON.stringify(columns));
  },

  // Service Categories
  getServiceCategories(): ServiceCategory[] {
    return loadOrDefault(KEYS.serviceCategories, DEFAULT_SERVICE_CATEGORIES);
  },
  persistServiceCategories(categories: ServiceCategory[]): void {
    localStorage.setItem(KEYS.serviceCategories, JSON.stringify(categories));
  },

  // Service Objectives
  getServiceObjectives(): ServiceObjective[] {
    return loadOrDefault(KEYS.serviceObjectives, DEFAULT_SERVICE_OBJECTIVES);
  },
  persistServiceObjectives(objectives: ServiceObjective[]): void {
    localStorage.setItem(KEYS.serviceObjectives, JSON.stringify(objectives));
  },

  // Project Columns
  getProjectColumns(): ProjectColumn[] {
    return loadOrDefault(KEYS.projectColumns, DEFAULT_PROJECT_COLUMNS);
  },
  persistProjectColumns(columns: ProjectColumn[]): void {
    localStorage.setItem(KEYS.projectColumns, JSON.stringify(columns));
  },

  generateId(): string {
    return uuidv4();
  },
};
