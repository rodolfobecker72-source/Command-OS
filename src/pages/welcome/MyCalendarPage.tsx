import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths, subMonths, addWeeks, subWeeks, format,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Briefcase, Phone, ExternalLink, CalendarDays } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type EventKind = 'project' | 'prospection';

interface PersonalEvent {
  id: string;
  date: Date;
  kind: EventKind;
  title: string;
  subtitle: string;
  status?: string;
  budgetId?: string;
  leadId?: string;
}

const STATUS_LABEL: Record<string, string> = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Date columns and ISO strings — anchor at noon to avoid TZ shifts
  const base = s.length <= 10 ? `${s}T12:00:00` : s;
  const d = new Date(base);
  return isNaN(d.getTime()) ? null : d;
}

export function MyCalendarPage() {
  const { user, workspace } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProjects, setShowProjects] = useState(true);
  const [showProspection, setShowProspection] = useState(true);
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PersonalEvent | null>(null);

  useEffect(() => {
    if (!user?.id || !workspace?.id) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [activitiesRes, leadsRes] = await Promise.all([
          supabase
            .from('project_activities')
            .select('id, title, status, due_date, project_card_id, assigned_to_user_ids')
            .eq('workspace_id', workspace.id)
            .contains('assigned_to_user_ids', [user.id])
            .not('due_date', 'is', null),
          supabase
            .from('prospection_leads')
            .select('id, company_name, next_action, next_action_date')
            .eq('workspace_id', workspace.id)
            .eq('responsible_user_id', user.id)
            .not('next_action_date', 'is', null)
            .neq('next_action_date', ''),
        ]);

        if (activitiesRes.error) throw activitiesRes.error;
        if (leadsRes.error) throw leadsRes.error;

        // Fetch related project cards in one round-trip
        const cardIds = Array.from(new Set((activitiesRes.data || []).map((a: any) => a.project_card_id).filter(Boolean)));
        const cardsMap = new Map<string, { proposalId: string; projectName: string; budgetId: string }>();
        if (cardIds.length) {
          const { data: cards } = await supabase
            .from('project_cards')
            .select('id, proposal_id, project_name, budget_id')
            .in('id', cardIds);
          (cards || []).forEach((c: any) =>
            cardsMap.set(c.id, { proposalId: c.proposal_id, projectName: c.project_name, budgetId: c.budget_id }),
          );
        }

        const list: PersonalEvent[] = [];

        for (const a of activitiesRes.data || []) {
          const d = parseDate(a.due_date as string);
          if (!d) continue;
          const card = cardsMap.get(a.project_card_id);
          list.push({
            id: `proj-${a.id}`,
            date: d,
            kind: 'project',
            title: a.title || '(sem título)',
            subtitle: card ? `${card.proposalId} — ${card.projectName}` : 'Projeto',
            status: a.status,
            budgetId: card?.budgetId,
          });
        }

        for (const l of leadsRes.data || []) {
          const d = parseDate(l.next_action_date as string);
          if (!d) continue;
          list.push({
            id: `prosp-${l.id}`,
            date: d,
            kind: 'prospection',
            title: l.next_action || 'Próxima ação',
            subtitle: l.company_name || 'Lead',
            leadId: l.id,
          });
        }

        if (active) setEvents(list);
      } catch (e: any) {
        console.error(e);
        toast.error('Erro ao carregar calendário pessoal');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user?.id, workspace?.id]);

  const visibleEvents = useMemo(
    () => events.filter(e => (e.kind === 'project' ? showProjects : showProspection)),
    [events, showProjects, showProspection],
  );

  const days = useMemo(() => {
    if (view === 'month') {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return eachDayOfInterval({
        start: startOfWeek(ms, { locale: ptBR }),
        end: endOfWeek(me, { locale: ptBR }),
      });
    }
    return eachDayOfInterval({
      start: startOfWeek(currentDate, { locale: ptBR }),
      end: endOfWeek(currentDate, { locale: ptBR }),
    });
  }, [view, currentDate]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, PersonalEvent[]>();
    for (const ev of visibleEvents) {
      const key = format(ev.date, 'yyyy-MM-dd');
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(ev);
    }
    return m;
  }, [visibleEvents]);

  const goPrev = () => setCurrentDate(d => view === 'month' ? subMonths(d, 1) : subWeeks(d, 1));
  const goNext = () => setCurrentDate(d => view === 'month' ? addMonths(d, 1) : addWeeks(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const headerLabel = view === 'month'
    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    : `Semana de ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })}`;

  const handleOpen = (ev: PersonalEvent) => setSelected(ev);

  const handleGoTo = () => {
    if (!selected) return;
    if (selected.kind === 'project') {
      if (selected.budgetId) navigate(`/gestao-projetos?budget=${selected.budgetId}`);
      else navigate('/gestao-projetos');
    } else {
      navigate('/prospeccao');
    }
    setSelected(null);
  };

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex flex-col h-full">
      <Header title="Meu Calendário" />

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-border bg-card">
        <Tabs value={view} onValueChange={v => setView(v as 'month' | 'week')}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-3 h-7">Mês</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3 h-7">Semana</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="text-sm md:text-base font-semibold capitalize flex-1 min-w-[140px]">{headerLabel}</h2>

        <div className="flex items-center gap-2">
          <Switch checked={showProjects} onCheckedChange={setShowProjects} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowProjects(v => !v)}>
            <Briefcase className="w-3.5 h-3.5 text-violet-500" />
            Projetos
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showProspection} onCheckedChange={setShowProspection} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowProspection(v => !v)}>
            <Phone className="w-3.5 h-3.5 text-orange-500" />
            Prospecção
          </label>
        </div>

        <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToday}>Hoje</Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-card">
        <div className="grid grid-cols-7 border-b border-border sticky top-0 bg-card z-10">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7', view === 'month' ? 'auto-rows-fr' : '')}>
          {days.map((day, i) => {
            const inMonth = view === 'week' || isSameMonth(day, currentDate);
            const today = isToday(day);
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(key) || [];

            return (
              <div
                key={i}
                className={cn(
                  'border-b border-r border-border p-1',
                  view === 'month' ? 'min-h-[80px] md:min-h-[110px]' : 'min-h-[200px]',
                  !inMonth && 'bg-muted/30',
                  today && 'bg-primary/5',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    today && 'bg-primary text-primary-foreground',
                    !inMonth && 'text-muted-foreground/50',
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[84px]">
                  {dayEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => handleOpen(ev)}
                      className={cn(
                        'w-full text-left rounded px-1.5 py-1 text-[10px] md:text-[11px] leading-tight truncate border transition-colors',
                        ev.kind === 'project'
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20',
                      )}
                      title={`${ev.title} — ${ev.subtitle}`}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        {ev.kind === 'project' ? <Briefcase className="w-3 h-3 shrink-0" /> : <Phone className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{ev.title}</span>
                      </div>
                      <div className="truncate opacity-80">{ev.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!loading && events.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade ou ação atribuída a você com data definida.
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.kind === 'project'
                ? <Briefcase className="w-5 h-5 text-violet-500" />
                : <Phone className="w-5 h-5 text-orange-500" />}
              {selected?.title}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selected.kind === 'project' ? 'Projeto' : 'Empresa'}
                </p>
                <p className="font-medium">{selected.subtitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(selected.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              {selected.kind === 'project' && selected.status && (
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{STATUS_LABEL[selected.status] || selected.status}</p>
                </div>
              )}
              <Button onClick={handleGoTo} className="w-full gap-2 mt-2">
                <ExternalLink className="w-4 h-4" />
                {selected.kind === 'project' ? 'Abrir em Gestão de Projetos' : 'Abrir em Prospecção'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
