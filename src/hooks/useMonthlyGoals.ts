import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (!workspace) return;
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
  }, [workspace]);

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
