import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Target, Plus, Trash2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthlyGoal {
  id?: string;
  month: string;
  value: number;
  meetingsGoal: number;
  isNew?: boolean;
}

export function GoalsPage() {
  const { workspace } = useAuth();
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New goal form
  const [newMonth, setNewMonth] = useState('');
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newValue, setNewValue] = useState('');

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    if (!workspace) return;
    loadGoals();
  }, [workspace]);

  async function loadGoals() {
    if (!workspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('month', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar metas');
      console.error(error);
    } else {
      setGoals((data || []).map(g => ({ id: g.id, month: g.month, value: Number(g.value) })));
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!newMonth || !newYear || !newValue || !workspace) return;
    const monthKey = `${newYear}-${newMonth.padStart(2, '0')}`;

    if (goals.some(g => g.month === monthKey)) {
      toast.error('Já existe uma meta para este mês');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('monthly_goals').insert({
      workspace_id: workspace.id,
      month: monthKey,
      value: parseFloat(newValue),
    });

    if (error) {
      toast.error('Erro ao salvar meta');
      console.error(error);
    } else {
      toast.success('Meta adicionada');
      setNewMonth('');
      setNewValue('');
      await loadGoals();
    }
    setSaving(false);
  }

  async function handleUpdate(goal: MonthlyGoal, newVal: number) {
    if (!goal.id) return;
    const { error } = await supabase
      .from('monthly_goals')
      .update({ value: newVal, updated_at: new Date().toISOString() })
      .eq('id', goal.id);

    if (error) {
      toast.error('Erro ao atualizar meta');
    } else {
      toast.success('Meta atualizada');
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, value: newVal } : g));
    }
  }

  async function handleDelete(goal: MonthlyGoal) {
    if (!goal.id) return;
    const { error } = await supabase.from('monthly_goals').delete().eq('id', goal.id);
    if (error) {
      toast.error('Erro ao excluir meta');
    } else {
      toast.success('Meta excluída');
      setGoals(prev => prev.filter(g => g.id !== goal.id));
    }
  }

  function formatMonthLabel(ym: string) {
    const [y, m] = ym.split('-');
    return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
  }

  function formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Metas Mensais" subtitle="Defina as metas de faturamento por mês" />
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

      {/* Add new goal */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Adicionar Meta</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Mês</label>
              <Select value={newMonth} onValueChange={setNewMonth}>
                <SelectTrigger className="h-9 text-sm w-36">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Ano</label>
              <Select value={newYear} onValueChange={setNewYear}>
                <SelectTrigger className="h-9 text-sm w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Valor (R$)</label>
              <Input
                type="number"
                placeholder="10000"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Button onClick={handleAdd} disabled={saving || !newMonth || !newValue} size="sm" className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals list */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Metas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Carregando...</p>
          ) : goals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Nenhuma meta cadastrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Mês</TableHead>
                  <TableHead className="text-xs text-right">Valor da Meta</TableHead>
                  <TableHead className="text-xs text-right w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map(g => (
                  <GoalRow key={g.id || g.month} goal={g} formatLabel={formatMonthLabel} formatCurrency={formatCurrency} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function GoalRow({ goal, formatLabel, formatCurrency, onUpdate, onDelete }: {
  goal: MonthlyGoal;
  formatLabel: (m: string) => string;
  formatCurrency: (v: number) => string;
  onUpdate: (g: MonthlyGoal, v: number) => void;
  onDelete: (g: MonthlyGoal) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(goal.value));

  function handleSave() {
    const v = parseFloat(editValue);
    if (isNaN(v) || v <= 0) return;
    onUpdate(goal, v);
    setEditing(false);
  }

  return (
    <TableRow>
      <TableCell className="text-xs font-medium py-2">{formatLabel(goal.month)}</TableCell>
      <TableCell className="text-right py-2">
        {editing ? (
          <div className="flex items-center gap-1 justify-end">
            <Input
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="h-7 text-xs w-28 text-right"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}>
              <Save className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <span className="text-xs font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => { setEditing(true); setEditValue(String(goal.value)); }}>
            {formatCurrency(goal.value)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right py-2">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(goal)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
