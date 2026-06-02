// Helper para disparar sync da atividade para o Google Calendar dos responsáveis.
// Falhas são silenciosas (apenas console.warn) — não bloqueiam UI.
import { supabase } from '@/integrations/supabase/client';

export async function syncActivityToGoogle(activityId: string, action: 'upsert' | 'delete' = 'upsert') {
  try {
    const { error } = await supabase.functions.invoke('google-calendar-sync-activity', {
      body: { activity_id: activityId, action },
    });
    if (error) console.warn('[gcal-sync]', error);
  } catch (e) {
    console.warn('[gcal-sync] failed', e);
  }
}
