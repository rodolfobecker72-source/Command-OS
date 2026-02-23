import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  ProspectionLead,
  LeadFunnelStatus,
} from '@/types/prospection';
import { prospectionService } from '@/services/prospectionService';

interface ProspectionContextType {
  leads: ProspectionLead[];
  addLead: (lead: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>) => ProspectionLead;
  updateLead: (id: string, updates: Partial<ProspectionLead>) => void;
  deleteLead: (id: string) => void;
  getLead: (id: string) => ProspectionLead | undefined;
  reactivateLead: (id: string) => void;
  migrateLeadToCRM: (id: string) => { clientName: string } | null;
}

const ProspectionContext = createContext<ProspectionContextType>({} as ProspectionContextType);

export function useProspection() {
  return useContext(ProspectionContext);
}

export function ProspectionProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<ProspectionLead[]>(() => prospectionService.getAll());

  const persist = (updated: ProspectionLead[]) => {
    setLeads(updated);
    prospectionService.persist(updated);
  };

  const addLead = useCallback((data: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'>): ProspectionLead => {
    const lead = prospectionService.create(data);
    setLeads(prospectionService.getAll());
    return lead;
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<ProspectionLead>) => {
    prospectionService.update(id, updates);
    setLeads(prospectionService.getAll());
  }, []);

  const deleteLead = useCallback((id: string) => {
    prospectionService.delete(id);
    setLeads(prospectionService.getAll());
  }, []);

  const getLead = useCallback((id: string) => {
    return leads.find(l => l.id === id);
  }, [leads]);

  const reactivateLead = useCallback((id: string) => {
    prospectionService.update(id, { funnelStatus: 'mapeado' as LeadFunnelStatus });
    setLeads(prospectionService.getAll());
  }, []);

  const migrateLeadToCRM = useCallback((id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.funnelStatus !== 'qualificado_crm') return null;
    prospectionService.update(id, { funnelStatus: 'qualificado_crm' });
    setLeads(prospectionService.getAll());
    return { clientName: lead.companyName };
  }, [leads]);

  return (
    <ProspectionContext.Provider value={{ leads, addLead, updateLead, deleteLead, getLead, reactivateLead, migrateLeadToCRM }}>
      {children}
    </ProspectionContext.Provider>
  );
}
