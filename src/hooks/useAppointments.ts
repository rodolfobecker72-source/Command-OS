import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import {
  Appointment,
  NewAppointmentInput,
  appointmentFromDb,
  appointmentToDb,
} from '@/types/appointment';


export function useAppointments() {
  const { user, workspace } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const workspaceId = workspace?.id;

  const reload = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments' as any)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('start_at');
      if (error) throw error;
      setAppointments(((data || []) as any[]).map(appointmentFromDb));
    } catch (e: any) {
      console.error('[appointments] reload error', e);
      toast.error('Erro ao carregar compromissos');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useRealtimeSync({
    workspaceId,
    tables: ['appointments', 'calendar_notes'],
    onChange: () => { reload(); },
  });


  const create = useCallback(
    async (input: NewAppointmentInput): Promise<Appointment | null> => {
      if (!workspaceId || !user?.id) {
        toast.error('Sem workspace ativo');
        return null;
      }
      try {
        const payload = {
          ...appointmentToDb(input as any),
          workspace_id: workspaceId,
          created_by: user.id,
        };
        const { data, error } = await supabase
          .from('appointments' as any)
          .insert(payload as any)
          .select('*')
          .single();
        if (error) throw error;
        const created = appointmentFromDb(data);
        setAppointments(prev => [...prev, created]);
        return created;
      } catch (e: any) {
        console.error('[appointments] create error', e);
        toast.error('Erro ao criar compromisso: ' + e.message);
        return null;
      }
    },
    [workspaceId, user?.id],
  );

  const update = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      const previous = appointments;
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a)),
      );
      try {
        const { error } = await supabase
          .from('appointments' as any)
          .update(appointmentToDb(updates) as any)
          .eq('id', id);
        if (error) throw error;
      } catch (e: any) {
        console.error('[appointments] update error', e);
        toast.error('Erro ao atualizar compromisso');
        setAppointments(previous);
      }
    },
    [appointments],
  );

  const remove = useCallback(
    async (id: string) => {
      const previous = appointments;
      setAppointments(prev => prev.filter(a => a.id !== id));
      try {
        const { error } = await supabase.from('appointments' as any).delete().eq('id', id);
        if (error) throw error;
        toast.success('Compromisso removido');
      } catch (e: any) {
        console.error('[appointments] delete error', e);
        toast.error('Erro ao remover compromisso');
        setAppointments(previous);
      }
    },
    [appointments],
  );

  return { appointments, loading, reload, create, update, remove };
}
