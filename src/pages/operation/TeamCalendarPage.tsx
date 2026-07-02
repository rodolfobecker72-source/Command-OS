import { useState, useMemo, useCallback, useEffect } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, format, addDays, addBusinessDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarActivityEvent, CalendarDeliveryEvent } from '@/components/operation/CalendarEventCard';
import { ChevronLeft, ChevronRight, CalendarDays, Package, Users } from 'lucide-react';
import { useCRM } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import { Budget } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarMonthView } from '@/components/operation/CalendarMonthView';
import { CalendarWeekView } from '@/components/operation/CalendarWeekView';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragEndEvent } from '@dnd-kit/core';

interface Member { id: string; name: string }

function computeDeliveryEvents(budgets: Budget[]): CalendarDeliveryEvent[] {
  const events: CalendarDeliveryEvent[] = [];
  for (const b of budgets) {
    if (b.status !== 'aprovada') continue;
    const execStart = b.executionStartDate ? new Date(b.executionStartDate) : null;
    const approvedVersion = b.approvedVersion != null
      ? b.versions?.find(v => v.version === b.approvedVersion)
      : null;
    const latestVersion = approvedVersion
      || (b.versions?.length ? [...b.versions].sort((a, c) => c.version - a.version)[0] : null);
    if (!latestVersion?.services?.length) continue;
    for (const svc of latestVersion.services) {
      if (!svc.deliveryType) continue;
      let d: Date;
      if (svc.deliveryType === 'data_especifica' && (svc as any).deliveryDate) {
        d = new Date((svc as any).deliveryDate + 'T12:00:00');
      } else if (!execStart) continue;
      else if (svc.deliveryType === 'realtime') d = new Date(execStart);
      else if (svc.deliveryType === 'dias_uteis' && svc.deliveryDays) d = addDays(addBusinessDays(execStart, svc.deliveryDays), -1);
      else if (svc.deliveryType === 'dias_corridos' && svc.deliveryDays) d = addDays(execStart, svc.deliveryDays - 1);
      else continue;
      events.push({
        id: `${b.id}-delivery-${svc.id}`,
        date: d,
        label: `📦 ${b.proposalId} - ${b.projectName} — ${svc.serviceType}`,
        budget: b,
        type: 'delivery',
        serviceId: svc.id,
      });
    }
  }
  return events;
}

function toIsoDateOnly(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TeamCalendarPage() {
  const { budgets, updateBudget, updateBudgetVersion } = useCRM();
  const { workspace } = useAuth();

  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDeliveries, setShowDeliveries] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<string>('');
  const [memberBudgetIds, setMemberBudgetIds] = useState<Set<string>>(new Set());
  const [memberActivityEvents, setMemberActivityEvents] = useState<CalendarActivityEvent[]>([]);
  const [loadingMember, setLoadingMember] = useState(false);

  // Load workspace members
  useEffect(() => {
    if (!workspace?.id) return;
    (async () => {
      const { data: wm } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspace.id);
      const ids = (wm || []).map((m: any) => m.user_id);
      if (!ids.length) { setMembers([]); return; }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      const list: Member[] = (profiles || [])
        .map((p: any) => ({ id: p.id, name: p.name || '' }))
        .filter(p => p.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setMembers(list);
    })();
  }, [workspace?.id]);

  // Load budget ids associated to selected member via:
  // 1) project_activities.assigned_to_user_ids (array)
  // 2) project_activities.assigned_to_user_id (legacy singular)
  // 3) budgets whose any version has a service.executor matching the member name
  useEffect(() => {
    if (!workspace?.id || !memberId) {
      setMemberBudgetIds(new Set());
      setMemberActivityEvents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMember(true);
      try {
        const memberName = members.find(m => m.id === memberId)?.name?.trim().toLowerCase() || '';

        const [actsArrRes, actsLegacyRes] = await Promise.all([
          supabase
            .from('project_activities')
            .select('id, title, status, due_date, end_date, is_delivery, project_card_id')
            .eq('workspace_id', workspace.id)
            .contains('assigned_to_user_ids', [memberId]),
          supabase
            .from('project_activities')
            .select('id, title, status, due_date, end_date, is_delivery, project_card_id')
            .eq('workspace_id', workspace.id)
            .eq('assigned_to_user_id', memberId),
        ]);
        const activitiesById = new Map<string, any>();
        for (const a of [...((actsArrRes.data || []) as any[]), ...((actsLegacyRes.data || []) as any[])]) {
          if (a?.id) activitiesById.set(a.id, a);
        }
        const memberActivities = Array.from(activitiesById.values());
        const cardIds = Array.from(new Set([
          ...memberActivities.map(a => a.project_card_id),
        ].filter(Boolean)));

        const bids = new Set<string>();
        const cardBudgetMap = new Map<string, string>();
        if (cardIds.length) {
          const { data: cards } = await supabase
            .from('project_cards')
            .select('id, budget_id')
            .in('id', cardIds);
          for (const c of (cards || []) as any[]) {
            if (c.id && c.budget_id) cardBudgetMap.set(c.id, c.budget_id);
            if (c.budget_id) bids.add(c.budget_id);
          }
        }

        const activityEvents: CalendarActivityEvent[] = memberActivities
          .filter((a: any) => a.due_date && a.project_card_id)
          .flatMap((a: any) => {
            const budgetId = cardBudgetMap.get(a.project_card_id);
            const budget = budgetId ? budgets.find(b => b.id === budgetId) : undefined;
            if (!budget) return [];
            const start = new Date(`${a.due_date}T12:00:00`);
            const end = a.end_date ? new Date(`${a.end_date}T12:00:00`) : start;
            const events: CalendarActivityEvent[] = [];
            const cur = new Date(start);
            while (cur.getTime() <= end.getTime()) {
              events.push({
                id: `${a.id}-${cur.toISOString().slice(0, 10)}`,
                activityId: a.id,
                date: new Date(cur),
                title: a.title || 'Atividade',
                status: a.status || 'nao_iniciado',
                budget,
                projectCardId: a.project_card_id,
                isDelivery: !!a.is_delivery,
              });
              cur.setDate(cur.getDate() + 1);
            }
            return events;
          });

        // Also include budgets where the member is executor or a cost supplier
        if (memberName) {
          const matches = (raw?: string | null) => {
            if (!raw) return false;
            const name = raw.trim().toLowerCase().replace(/^freela:\s*/i, '');
            return name === memberName;
          };
          for (const b of budgets) {
            if (bids.has(b.id)) continue;
            const exec = (b as any).execution;
            const inExecutor = matches(exec?.executor);
            const inCosts = !!exec && [
              ...((exec.services || []) as any[]).flatMap(s => [...(s.costs || []), ...(s.extraCosts || [])]),
              ...((exec.operationalCosts || []) as any[]),
              ...((exec.extraOperationalCosts || []) as any[]),
            ].some((c: any) => matches(c?.supplier));
            if (inExecutor || inCosts) bids.add(b.id);
          }
        }

        if (!cancelled) {
          setMemberBudgetIds(bids);
          setMemberActivityEvents(activityEvents);
        }
      } finally {
        if (!cancelled) setLoadingMember(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspace?.id, memberId, budgets, members]);


  const memberBudgets = useMemo(
    () => budgets.filter(b => memberBudgetIds.has(b.id)),
    [budgets, memberBudgetIds]
  );

  const approvedBudgets = useMemo(() => memberBudgets.filter(b => b.status === 'aprovada'), [memberBudgets]);
  const pendingBudgets = useMemo(
    () => memberBudgets.filter(b => b.status !== 'aprovada' && b.status !== 'nao_aprovada' && b.executionStartDate),
    [memberBudgets],
  );
  const calendarEvents = useMemo(() => approvedBudgets.filter(b => b.executionStartDate), [approvedBudgets]);
  const deliveryEvents = useMemo(() => computeDeliveryEvents(approvedBudgets), [approvedBudgets]);

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(d => view === 'month' ? subMonths(d, 1) : subWeeks(d, 1));
  const goNext = () => setCurrentDate(d => view === 'month' ? addMonths(d, 1) : addWeeks(d, 1));

  const headerLabel = view === 'month'
    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    : `Semana de ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })}`;

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const dropDate: Date | undefined = (over.data?.current as any)?.date;
    if (!dropDate) return;
    const data = active.data?.current as any;
    if (!data) return;

    if (data.type === 'budget') {
      const b = budgets.find(x => x.id === data.budgetId);
      if (!b || !b.executionStartDate) return;
      const oldStart = new Date(b.executionStartDate);
      const oldDay = new Date(oldStart); oldDay.setHours(0,0,0,0);
      const newDay = new Date(dropDate); newDay.setHours(0,0,0,0);
      const delta = differenceInCalendarDays(newDay, oldDay);
      if (delta === 0) return;
      const newStart = addDays(oldStart, delta);
      const newEnd = b.executionEndDate ? addDays(new Date(b.executionEndDate), delta) : null;
      await updateBudget(b.id, {
        executionStartDate: newStart,
        executionEndDate: newEnd,
        executionMonth: format(newStart, 'yyyy-MM'),
      });
      toast.success(`Movido para ${format(newStart, 'dd/MM/yyyy')}`);
    } else if (data.type === 'delivery') {
      const b = budgets.find(x => x.id === data.budgetId);
      if (!b) return;
      const approvedVer = b.approvedVersion != null
        ? b.versions?.find(v => v.version === b.approvedVersion)
        : null;
      const ver = approvedVer || (b.versions?.length ? [...b.versions].sort((a, c) => c.version - a.version)[0] : null);
      if (!ver) return;
      const newServices = ver.services.map(s => s.id === data.serviceId
        ? { ...s, deliveryType: 'data_especifica' as const, deliveryDate: toIsoDateOnly(dropDate) }
        : s);
      await updateBudgetVersion(b.id, ver.id, { services: newServices });
      toast.success(`Entrega ajustada para ${format(dropDate, 'dd/MM/yyyy')}`);
    } else if (data.type === 'activity') {
      const dropIso = toIsoDateOnly(dropDate);
      const { error } = await supabase
        .from('project_activities')
        .update({ due_date: dropIso } as any)
        .eq('id', data.activityId);
      if (error) {
        toast.error('Erro ao ajustar data da atividade');
        return;
      }
      setMemberActivityEvents(prev => prev.map(activity => (
        activity.id === data.activityId
          ? { ...activity, date: new Date(`${dropIso}T12:00:00`) }
          : activity
      )));
      toast.success(`Atividade ajustada para ${format(dropDate, 'dd/MM/yyyy')}`);
    }
  }, [budgets, updateBudget, updateBudgetVersion]);

  const selectedMemberName = members.find(m => m.id === memberId)?.name;

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendário do Time" subtitle="Visualize e ajuste as datas dos projetos de cada membro do time." />

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-[240px]">
          <Users className="w-4 h-4 text-muted-foreground" />
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue placeholder="Selecione um membro do time" />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              {members.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum membro</div>
              )}
              {members.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={view} onValueChange={v => setView(v as 'month' | 'week')}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-3 h-7">Mês</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3 h-7">Semana</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        <h2 className="text-sm md:text-base font-semibold capitalize flex-1 min-w-[140px]">{headerLabel}</h2>

        <div className="flex items-center gap-2">
          <Switch checked={showDeliveries} onCheckedChange={setShowDeliveries} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowDeliveries(v => !v)}>
            <Package className="w-3.5 h-3.5 text-blue-500" /> Entregas
          </label>
        </div>

        <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToday}>Hoje</Button>
      </div>

      <div className="px-4 md:px-6 py-1.5 text-[11px] text-muted-foreground bg-muted/40 border-b border-border">
        {memberId
          ? <>Mostrando projetos com atividades atribuídas a <strong>{selectedMemberName}</strong>. Arraste cards para reagendar — as datas são atualizadas no card do projeto.</>
          : 'Selecione um membro acima para ver seus projetos.'}
      </div>

      <div className="flex-1 overflow-auto bg-card">
        {!memberId ? (
          <div className="h-full flex items-center justify-center p-12 text-center text-muted-foreground text-sm">
            <div>
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Selecione um membro do time para visualizar o calendário de projetos.
            </div>
          </div>
        ) : loadingMember ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : memberBudgets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm space-y-2">
            <div>Nenhum projeto encontrado para <strong>{selectedMemberName}</strong>.</div>
            <div className="text-xs opacity-80">
              Um projeto aparece aqui quando o membro é responsável por alguma atividade do projeto ou executor/fornecedor de algum custo na execução do orçamento.
            </div>
          </div>

        ) : view === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            events={calendarEvents}
            pendingEvents={pendingBudgets}
            deliveryEvents={showDeliveries ? deliveryEvents : []}
            activityEvents={memberActivityEvents}
            onEventClick={setSelectedBudget}
            onDeliveryClick={(b) => setSelectedBudget(b)}
            onActivityClick={(a) => setSelectedBudget(a.budget)}
            onDragEndDay={handleDragEnd}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            events={calendarEvents}
            pendingEvents={pendingBudgets}
            deliveryEvents={showDeliveries ? deliveryEvents : []}
            activityEvents={memberActivityEvents}
            onEventClick={setSelectedBudget}
            onDeliveryClick={(b) => setSelectedBudget(b)}
            onActivityClick={(a) => setSelectedBudget(a.budget)}
            onDragEndDay={handleDragEnd}
          />
        )}
      </div>

      {/* Simple detail dialog */}
      <Dialog open={!!selectedBudget} onOpenChange={open => { if (!open) setSelectedBudget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedBudget?.proposalId} - {selectedBudget?.projectName}</DialogTitle>
          </DialogHeader>
          {selectedBudget && (
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Período</p>
                <p className="font-medium">
                  {selectedBudget.executionStartDate ? format(new Date(selectedBudget.executionStartDate), 'dd/MM/yyyy') : '—'}
                  {selectedBudget.executionEndDate ? ` → ${format(new Date(selectedBudget.executionEndDate), 'dd/MM/yyyy')}` : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Arraste o card no calendário para alterar as datas. As mudanças aparecem automaticamente no card do projeto.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
