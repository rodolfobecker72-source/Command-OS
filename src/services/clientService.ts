import { v4 as uuidv4 } from 'uuid';
import { Client } from '@/types/crm';

const STORAGE_KEY = 'crm_clients';

export const clientService = {
  getAll(): Client[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  getById(id: string): Client | undefined {
    return clientService.getAll().find(c => c.id === id);
  },

  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const now = new Date().toISOString();
    const client: Client = {
      ...data,
      id: uuidv4(),
      createdAt: now as any,
      updatedAt: now as any,
    };
    const all = [...clientService.getAll(), client];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return client;
  },

  update(id: string, updates: Partial<Client>): void {
    const all = clientService.getAll().map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() as any } : c
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  delete(id: string): void {
    const all = clientService.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  persist(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  },
};
