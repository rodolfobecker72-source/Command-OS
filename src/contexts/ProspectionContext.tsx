import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import {
  ProspectionLead,
  LeadFunnelStatus,
} from '@/types/prospection';
import { prospectionService } from '@/services/prospectionService';
import { useAuth } from '@/contexts/AuthContext';

interface ProspectionContextType {
  leads: ProspectionLead[];
  isLoading: boolean;
  addLead: (lead: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProspectionLead>;
  updateLead: (id: string, updates: Partial<ProspectionLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  getLead: (id: string) => ProspectionLead | undefined;
  reactivateLead: (id: string) => Promise<void>;
  migrateLeadToCRM: (id: string) => { clientName: string } | null;
  refreshLeads: () => Promise<void>;
}

const ProspectionContext = createContext<ProspectionContextType>({} as ProspectionContextType);

export function useProspection() {
  return useContext(ProspectionContext);
}

export function ProspectionProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<ProspectionLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { workspace } = useAuth();

  const refreshLeads = useCallback(async () => {
    if (!workspace?.id) return;
    try {
      const data = await prospectionService.getAll(workspace.id);
      setLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  const addLead = useCallback(async (data: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProspectionLead> => {
    if (!workspace?.id) throw new Error('No workspace');
    const lead = await prospectionService.create(workspace.id, data);
    setLeads(prev => [lead, ...prev]);
    return lead;
  }, [workspace?.id]);

  const updateLead = useCallback(async (id: string, updates: Partial<ProspectionLead>) => {
    await prospectionService.update(id, updates);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    await prospectionService.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const getLead = useCallback((id: string) => {
    return leads.find(l => l.id === id);
  }, [leads]);

  const reactivateLead = useCallback(async (id: string) => {
    await prospectionService.update(id, { funnelStatus: 'mapeado' as LeadFunnelStatus });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, funnelStatus: 'mapeado' as LeadFunnelStatus } : l));
  }, []);

  const migrateLeadToCRM = useCallback((id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.funnelStatus !== 'qualificado_crm') return null;
    return { clientName: lead.companyName };
  }, [leads]);

  return (
    <ProspectionContext.Provider value={{ leads, isLoading, addLead, updateLead, deleteLead, getLead, reactivateLead, migrateLeadToCRM, refreshLeads }}>
      {children}
    </ProspectionContext.Provider>
  );
}
