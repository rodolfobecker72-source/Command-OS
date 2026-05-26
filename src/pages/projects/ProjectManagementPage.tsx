import { useState, useMemo } from 'react';
import { ChevronRight, Settings2, ListChecks, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRM } from '@/contexts/CRMContext';
import { ProjectStatusManagerDialog } from '@/components/projects/ProjectStatusManagerDialog';
import { ProjectActivitiesDialog } from '@/components/projects/ProjectActivitiesDialog';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMonthLabel(ym: string | null): string {
  if (!ym) return 'Sem mês definido';
  const [y, m] = ym.split('-');
  const idx = parseInt(m, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return ym;
  return `${MONTH_NAMES[idx]} ${y}`;
}

export function ProjectManagementPage() {
  const { projectColumns, projectCards, updateProjectCard, budgets, updateBudget } = useCRM();
  const [manageOpen, setManageOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activitiesFor, setActivitiesFor] = useState<{ id: string; name: string } | null>(null);

  const sortedColumns = useMemo(
    () => [...projectColumns].sort((a, b) => a.order - b.order),
    [projectColumns]
  );

  const budgetById = useMemo(() => {
    const m: Record<string, typeof budgets[number]> = {};
    for (const b of budgets) m[b.id] = b;
    return m;
  }, [budgets]);

  // status -> month(YYYY-MM | '__none__') -> cards
  const cardsByStatusAndMonth = useMemo(() => {
    const numOf = (c: typeof projectCards[number]) => {
      const n = parseInt(String(c.proposalId ?? '').replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };
    const result: Record<string, { month: string | null; cards: typeof projectCards }[]> = {};
    for (const col of projectColumns) result[col.key] = [];
    for (const card of projectCards) {
      const statusKey = result[card.status] ? card.status : null;
      if (!statusKey) {
        if (!result[card.status]) result[card.status] = [];
      }
      const month = budgetById[card.budgetId]?.executionMonth ?? null;
      const bucketKey = month || '__none__';
      let bucket = result[card.status].find(b => (b.month || '__none__') === bucketKey);
      if (!bucket) {
        bucket = { month, cards: [] };
        result[card.status].push(bucket);
      }
      bucket.cards.push(card);
    }
    for (const key of Object.keys(result)) {
      // sort cards inside each month
      for (const b of result[key]) {
        b.cards = [...b.cards].sort((a, b) => numOf(a) - numOf(b));
      }
      // sort months ascending; nulls last
      result[key].sort((a, b) => {
        if (!a.month && !b.month) return 0;
        if (!a.month) return 1;
        if (!b.month) return -1;
        return a.month.localeCompare(b.month);
      });
    }
    return result;
  }, [projectColumns, projectCards, budgetById]);

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleMonthChange = (budgetId: string | undefined, value: string) => {
    if (!budgetId) return;
    updateBudget(budgetId, { executionMonth: value || null });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Gestão de Projetos"
        subtitle="Acompanhe todo fluxo de projetos da produtora, demandas, responsáveis, datas e objetivos."
      />
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-end gap-4 mb-2">
        <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
          <Settings2 className="w-4 h-4 mr-2" />
          Gerenciar status
        </Button>
      </div>

      <div className="mt-8 space-y-1">
        {sortedColumns.map((col) => {
          const buckets = cardsByStatusAndMonth[col.key] || [];
          const totalCards = buckets.reduce((acc, b) => acc + b.cards.length, 0);
          const isCollapsed = collapsed[col.key];
          return (
            <div key={col.id} className="border-b border-border/50">
              <button
                onClick={() => toggle(col.key)}
                className="w-full flex items-center gap-2 py-3 hover:bg-muted/30 transition-colors px-2 rounded-md text-left"
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    !isCollapsed && 'rotate-90'
                  )}
                />
                <span className={cn('inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-sm font-medium bg-muted/50')}>
                  <span className={cn('w-2 h-2 rounded-full', col.color)} />
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{totalCards}</span>
              </button>

              {!isCollapsed && (
                <div className="pl-9 pb-3 pr-2 space-y-3">
                  {totalCards === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhum projeto neste status</p>
                  ) : (
                    buckets.map((bucket) => (
                      <div key={bucket.month || '__none__'} className="space-y-1">
                        <div className="flex items-center gap-2 mt-1 mb-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {formatMonthLabel(bucket.month)}
                          </span>
                          <span className="text-xs text-muted-foreground">· {bucket.cards.length}</span>
                        </div>
                        <ul className="space-y-1">
                          {bucket.cards.map((card) => {
                            const budget = budgetById[card.budgetId];
                            return (
                              <li
                                key={card.id}
                                className="text-sm py-1.5 px-2 rounded hover:bg-muted/40 flex items-center justify-between gap-3"
                              >
                                <button
                                  type="button"
                                  onClick={() => setActivitiesFor({ id: card.id, name: `${card.proposalId ? card.proposalId + ' - ' : ''}${card.projectName}${card.clientName ? ' · ' + card.clientName : ''}` })}
                                  className="min-w-0 flex-1 text-left flex items-center gap-2 hover:text-primary"
                                  title="Ver atividades do projeto"
                                >
                                  <ListChecks className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">
                                    {card.proposalId && (
                                      <span className="font-medium">{card.proposalId} - </span>
                                    )}
                                    <span className="font-medium">{card.projectName}</span>
                                    {card.clientName && (
                                      <span className="text-muted-foreground"> · {card.clientName}</span>
                                    )}
                                  </span>
                                </button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs shrink-0 gap-1"
                                      title="Alterar mês de execução"
                                    >
                                      <CalendarIcon className="w-3 h-3" />
                                      {budget?.executionMonth ? formatMonthLabel(budget.executionMonth) : 'Definir mês'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3 z-[200]" align="end">
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium text-muted-foreground">Mês de execução</label>
                                      <Input
                                        type="month"
                                        value={budget?.executionMonth ?? ''}
                                        onChange={(e) => handleMonthChange(card.budgetId, e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                      {budget?.executionMonth && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs w-full"
                                          onClick={() => handleMonthChange(card.budgetId, '')}
                                        >
                                          Remover mês
                                        </Button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Select
                                  value={card.status}
                                  onValueChange={(value) => updateProjectCard(card.id, { status: value })}
                                >
                                  <SelectTrigger className="h-7 w-[170px] text-xs shrink-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[200]">
                                    {sortedColumns.map((c) => (
                                      <SelectItem key={c.key} value={c.key} className="text-xs">
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ProjectStatusManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
      {activitiesFor && (
        <ProjectActivitiesDialog
          open={!!activitiesFor}
          onOpenChange={(o) => !o && setActivitiesFor(null)}
          projectCardId={activitiesFor.id}
          projectName={activitiesFor.name}
        />
      )}
      </div>
    </div>
  );
}

export default ProjectManagementPage;
