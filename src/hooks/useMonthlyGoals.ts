import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export interface MonthlyGoal {
  id: string;
  month: string;
  value: number;
  meetingsGoal: number;
}

export function useMonthlyGoals() {
  const { workspace } = useAuth();
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!workspace) return;
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('workspace_id', workspace.id);
    setGoals((data || []).map((g: any) => ({
      id: g.id,
      month: g.month,
      value: Number(g.value),
      meetingsGoal: Number(g.meetings_goal ?? 0),
    })));
    if (!silent) setLoading(false);
  }, [workspace]);

  useEffect(() => { load(false); }, [load]);

  useRealtimeSync({
    workspaceId: workspace?.id,
    tables: ['monthly_goals'],
    onChange: () => load(true),
  });

  function getGoalForMonth(month: string): number | null {
    const g = goals.find(g => g.month === month);
    return g ? g.value : null;
  }

  function getMeetingsGoalForMonth(month: string): number | null {
    const g = goals.find(g => g.month === month);
    return g && g.meetingsGoal > 0 ? g.meetingsGoal : null;
  }

  return { goals, loading, getGoalForMonth, getMeetingsGoalForMonth };
}
