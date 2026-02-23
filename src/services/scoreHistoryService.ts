import { supabase } from '@/integrations/supabase/client';
import type { ScoreHistoryEntry } from '@/components/client/ScoreHistory';

function rowToEntry(row: any): ScoreHistoryEntry {
  return {
    id: row.id,
    score: row.score,
    previousScore: row.previous_score,
    reason: row.reason,
    timestamp: new Date(row.created_at),
  };
}

export const scoreHistoryService = {
  async getAll(workspaceId: string): Promise<ScoreHistoryEntry[]> {
    const { data, error } = await supabase.from('score_history').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToEntry);
  },

  async getByClient(workspaceId: string, clientId: string): Promise<ScoreHistoryEntry[]> {
    const { data, error } = await supabase.from('score_history').select('*').eq('workspace_id', workspaceId).eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToEntry);
  },

  async add(workspaceId: string, clientId: string, entry: Omit<ScoreHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase.from('score_history').insert({
      workspace_id: workspaceId, client_id: clientId, score: entry.score, previous_score: entry.previousScore, reason: entry.reason,
    });
    if (error) throw error;
  },
};
