import { v4 as uuidv4 } from 'uuid';
import { ProspectionLead } from '@/types/prospection';

const STORAGE_KEY = 'hero_prospection_leads';

export const prospectionService = {
  getAll(): ProspectionLead[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  getById(id: string): ProspectionLead | undefined {
    return prospectionService.getAll().find(l => l.id === id);
  },

  create(data: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>): ProspectionLead {
    const now = new Date().toISOString();
    const lead: ProspectionLead = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const all = [...prospectionService.getAll(), lead];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return lead;
  },

  update(id: string, updates: Partial<ProspectionLead>): ProspectionLead | undefined {
    const all = prospectionService.getAll();
    const index = all.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[index];
  },

  delete(id: string): void {
    const all = prospectionService.getAll().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  persist(leads: ProspectionLead[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  },
};
