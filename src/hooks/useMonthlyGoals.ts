import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthlyGoal {
  id: string;
  month: string;
  value: number;
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
      setGoals((data || []).map(g => ({ id: g.id, month: g.month, value: Number(g.value) })));
      setLoading(false);
    })();
  }, [workspace]);

  function getGoalForMonth(month: string): number | null {
    const g = goals.find(g => g.month === month);
    return g ? g.value : null;
  }

  return { goals, loading, getGoalForMonth };
}
