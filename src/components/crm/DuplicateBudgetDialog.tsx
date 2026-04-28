import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCRM } from '@/contexts/CRMContext';

interface DuplicateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  projectName: string;
  baseExecutionMonth?: string | null;
}

const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatYM(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_NAMES_PT[idx] || m}/${y}`;
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function DuplicateBudgetDialog({ open, onOpenChange, budgetId, projectName, baseExecutionMonth }: DuplicateBudgetDialogProps) {
  const { duplicateBudget } = useCRM();
  const [count, setCount] = useState(3);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Mês base = mês de execução existente OU mês atual
  const baseMonth = useMemo(() => {
    if (baseExecutionMonth) return baseExecutionMonth;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [baseExecutionMonth]);

  // Gera lista de meses futuros (a partir do mês seguinte ao base)
  const futureMonths = useMemo(() => {
    const months: string[] = [];
    const max = Math.max(1, Math.min(24, count));
    for (let i = 1; i <= max; i++) {
      months.push(addMonths(baseMonth, i));
    }
    return months;
  }, [baseMonth, count]);

  // Sincroniza seleção quando a lista muda
  const allSelected = futureMonths.length > 0 && futureMonths.every(m => selected.has(m));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(futureMonths));
    }
  };

  const toggleMonth = (m: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const handleConfirm = async () => {
    const months = futureMonths.filter(m => selected.has(m));
    if (months.length === 0) {
      toast.error('Selecione pelo menos um mês para duplicar.');
      return;
    }
    setLoading(true);
    try {
      const created = await duplicateBudget(budgetId, months);
      if (created > 0) {
        toast.success(`${created} card(s) duplicado(s) com sucesso!`);
        onOpenChange(false);
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Duplicar projeto
          </DialogTitle>
          <DialogDescription>
            Replique <strong>{projectName}</strong> para meses futuros, mantendo a mesma identificação e variando apenas o mês de execução.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-xs text-muted-foreground">
            Mês base: <strong>{formatYM(baseMonth)}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Quantos meses à frente?</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={24}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Selecione os meses:</Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-accent hover:underline"
              >
                {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 border rounded-md">
              {futureMonths.map(m => (
                <label
                  key={m}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selected.has(m)}
                    onCheckedChange={() => toggleMonth(m)}
                  />
                  <span>{formatYM(m)}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.size} mês(es) selecionado(s) — serão criados {selected.size} novo(s) card(s) com novos identificadores de proposta.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || selected.size === 0}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
            Duplicar {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
