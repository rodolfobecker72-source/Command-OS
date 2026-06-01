import { useState, useMemo, ReactNode, useEffect } from 'react';
import { ChevronRight, Settings2, Calendar as CalendarIcon, GripVertical, ExternalLink } from 'lucide-react';
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRM } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProjectStatusManagerDialog } from '@/components/projects/ProjectStatusManagerDialog';
import { ProjectActivitiesDialog } from '@/components/projects/ProjectActivitiesDialog';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

function DroppableStatus({ statusKey, children, isOver: _ignored, className }: { statusKey: string; children: ReactNode; isOver?: boolean; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `status-${statusKey}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'bg-accent/10 ring-2 ring-accent/40 rounded-md')}
    >
      {children}
    </div>
  );
}

function DraggableRow({ id, children }: { id: string; children: (handleProps: { listeners: any; attributes: any }) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} className="list-none">
      {children({ listeners, attributes })}
    </li>
  );
}


// Map status color tokens (bg-*) to subtle background tints for the status block
// and a slightly stronger tint for each month group inside.
const STATUS_TINT: Record<string, { block: string; month: string; border: string }> = {
  'bg-info': { block: 'bg-info/[0.04]', month: 'bg-info/[0.09]', border: 'border-info/20' },
  'bg-warning': { block: 'bg-warning/[0.04]', month: 'bg-warning/[0.09]', border: 'border-warning/20' },
  'bg-success': { block: 'bg-success/[0.04]', month: 'bg-success/[0.09]', border: 'border-success/20' },
  'bg-destructive': { block: 'bg-destructive/[0.04]', month: 'bg-destructive/[0.09]', border: 'border-destructive/20' },
  'bg-accent': { block: 'bg-accent/[0.04]', month: 'bg-accent/[0.09]', border: 'border-accent/30' },
  'bg-muted-foreground': { block: 'bg-muted-foreground/[0.04]', month: 'bg-muted-foreground/[0.09]', border: 'border-muted-foreground/20' },
};
const DEFAULT_TINT = { block: 'bg-muted/30', month: 'bg-muted/50', border: 'border-border/50' };

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
  const { workspace } = useAuth();
  const [manageOpen, setManageOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activitiesFor, setActivitiesFor] = useState<{ id: string; name: string } | null>(null);
  const [activityCounts, setActivityCounts] = useState<Record<string, { total: number; done: number }>>({});

  useEffect(() => {
    if (!workspace?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('project_activities')
        .select('project_card_id,status')
        .eq('workspace_id', workspace.id);
      if (cancelled || !data) return;
      const counts: Record<string, { total: number; done: number }> = {};
      for (const a of data as any[]) {
        const id = a.project_card_id as string;
        if (!counts[id]) counts[id] = { total: 0, done: 0 };
        counts[id].total += 1;
        if (a.status === 'concluido') counts[id].done += 1;
      }
      setActivityCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [workspace?.id, projectCards.length]);

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

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('status-')) return;
    const newStatus = overId.slice('status-'.length);
    const card = projectCards.find(c => c.id === active.id);
    if (!card || card.status === newStatus) return;
    updateProjectCard(card.id, { status: newStatus });
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

      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="mt-8 space-y-2">

        {sortedColumns.map((col) => {
          const buckets = cardsByStatusAndMonth[col.key] || [];
          const totalCards = buckets.reduce((acc, b) => acc + b.cards.length, 0);
          const isCollapsed = collapsed[col.key];
          const tint = STATUS_TINT[col.color] || DEFAULT_TINT;
          return (
            <div key={col.id} className={cn('rounded-lg border', tint.border, tint.block)}>
              <button
                onClick={() => toggle(col.key)}
                className="w-full flex items-center gap-2 py-3 hover:bg-foreground/[0.03] transition-colors px-3 rounded-md text-left"
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    !isCollapsed && 'rotate-90'
                  )}
                />
                <span className={cn('inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-sm font-medium bg-background/60')}>
                  <span className={cn('w-2 h-2 rounded-full', col.color)} />
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{totalCards}</span>
              </button>

              {!isCollapsed && (
                <DroppableStatus statusKey={col.key} className="pl-9 pb-3 pr-3 space-y-3 min-h-[40px]">
                  {totalCards === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhum projeto neste status (solte aqui)</p>
                  ) : (
                    buckets.map((bucket) => (
                      <div key={bucket.month || '__none__'} className={cn('space-y-1 rounded-md border px-2 py-2', tint.border, tint.month)}>
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {formatMonthLabel(bucket.month)}
                          </span>
                          <span className="text-xs text-muted-foreground">· {bucket.cards.length}</span>
                        </div>
                        <ul className="space-y-1 overflow-x-auto -mx-2 px-2">
                          {bucket.cards.map((card) => {
                            const budget = budgetById[card.budgetId];
                            const counts = activityCounts[card.id] || { total: 0, done: 0 };
                            const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
                            const driveUrl = card.driveUrl?.trim();
                            const handleEditDrive = (e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const current = card.driveUrl || '';
                              const next = window.prompt('Link do Google Drive deste projeto:', current);
                              if (next === null) return;
                              updateProjectCard(card.id, { driveUrl: next.trim() });
                            };
                            return (
                              <DraggableRow key={card.id} id={card.id}>
                                {({ listeners, attributes }) => (
                                  <div className="text-sm py-1.5 px-2 rounded hover:bg-muted/40 flex items-center gap-3 bg-background">
                                    <button
                                      type="button"
                                      {...listeners}
                                      {...attributes}
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
                                      title="Arraste para mudar de status"
                                      aria-label="Arrastar"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </button>
                                    <Select
                                      value={card.status}
                                      onValueChange={(value) => updateProjectCard(card.id, { status: value })}
                                    >
                                      <SelectTrigger className="h-7 w-[150px] text-xs shrink-0">
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
                                    <button
                                      type="button"
                                      onClick={() => setActivitiesFor({ id: card.id, name: `${card.proposalId ? card.proposalId + ' - ' : ''}${card.projectName}${card.clientName ? ' · ' + card.clientName : ''}` })}
                                      className="min-w-0 flex-1 text-left hover:text-primary"
                                      title="Ver atividades do projeto"
                                    >
                                      <div className="truncate">
                                        {card.proposalId && (
                                          <span className="font-medium">{card.proposalId} - </span>
                                        )}
                                        <span className="font-medium">{card.projectName}</span>
                                      </div>
                                      {card.clientName && (
                                        <div className="text-xs text-muted-foreground truncate">{card.clientName}</div>
                                      )}
                                    </button>
                                    <span
                                      className={cn(
                                        'text-xs font-semibold shrink-0 tabular-nums px-2 py-0.5 rounded-full',
                                        pct === 100 ? 'bg-success/10 text-success' : pct > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                      )}
                                      title={`${counts.done}/${counts.total} atividades concluídas`}
                                    >
                                      {pct}%
                                    </span>
                                    {driveUrl ? (
                                      <a
                                        href={driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary shrink-0"
                                        title={`Abrir Drive do projeto · clique direito para editar\n${driveUrl}`}
                                        onClick={(e) => e.stopPropagation()}
                                        onContextMenu={handleEditDrive}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={handleEditDrive}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-dashed border-border text-muted-foreground/60 hover:text-primary hover:border-primary shrink-0"
                                        title="Cadastrar link do Drive deste projeto"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </button>
                                    )}
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
                                  </div>
                                )}
                              </DraggableRow>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </DroppableStatus>
              )}

            </div>
          );
        })}
      </div>
      </DndContext>


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
