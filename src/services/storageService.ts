import { v4 as uuidv4 } from 'uuid';
import { HardDrive, LegacyProject } from '@/types/crm';

const HD_KEY = 'crm_hard_drives';
const LEGACY_KEY = 'crm_legacy_projects';

export const storageService = {
  // Hard Drives
  getHardDrives(): HardDrive[] {
    const saved = localStorage.getItem(HD_KEY);
    return saved ? JSON.parse(saved) : [];
  },
  persistHardDrives(drives: HardDrive[]): void {
    localStorage.setItem(HD_KEY, JSON.stringify(drives));
  },

  // Legacy Projects
  getLegacyProjects(): LegacyProject[] {
    const saved = localStorage.getItem(LEGACY_KEY);
    return saved ? JSON.parse(saved) : [];
  },
  persistLegacyProjects(projects: LegacyProject[]): void {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(projects));
  },

  generateId(): string {
    return uuidv4();
  },
};
