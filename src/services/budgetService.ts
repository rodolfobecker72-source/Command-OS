import { v4 as uuidv4 } from 'uuid';
import { Budget, BudgetVersion } from '@/types/crm';

const STORAGE_KEY = 'crm_budgets';

export const budgetService = {
  getAll(): Budget[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  getById(id: string): Budget | undefined {
    return budgetService.getAll().find(b => b.id === id);
  },

  persist(budgets: Budget[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  },

  generateId(): string {
    return uuidv4();
  },
};
