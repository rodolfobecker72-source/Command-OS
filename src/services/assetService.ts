import { v4 as uuidv4 } from 'uuid';
import { Asset } from '@/types/crm';

const STORAGE_KEY = 'crm_assets';

export const assetService = {
  getAll(): Asset[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  getById(id: string): Asset | undefined {
    return assetService.getAll().find(a => a.id === id);
  },

  create(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Asset {
    const now = new Date().toISOString();
    const asset: Asset = {
      ...data,
      id: uuidv4(),
      createdAt: now as any,
      updatedAt: now as any,
    };
    const all = [...assetService.getAll(), asset];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return asset;
  },

  persist(assets: Asset[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  },
};
