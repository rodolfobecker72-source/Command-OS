import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths, subMonths, addWeeks, subWeeks, format, addDays, differenceInCalendarDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Briefcase, Phone, ExternalLink, CalendarDays, StickyNote, Plus, Pencil, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DndContext, DragEndEvent, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentDialog } from '@/components/operation/AppointmentDialog';
import { Appointment, APPOINTMENT_KIND_COLORS } from '@/types/appointment';


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
  /** Raw id used to persist date updates when dragging. */
  sourceId: string;
}

interface PersonalNote {
  id: string;
  date: string; // yyyy-MM-dd
  content: string;
}


const STATUS_LABEL: Record<string, string> = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
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
  const [showNotes, setShowNotes] = useState(true);
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PersonalEvent | null>(null);
  const [showAppointments, setShowAppointments] = useState(true);

  // Appointments
  const { appointments, create: createAppt, update: updateAppt, remove: removeAppt } = useAppointments();
  const [apptDialogOpen, setApptDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [createApptAt, setCreateApptAt] = useState<Date | null>(null);

  // Note editor state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [noteDate, setNoteDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!user?.id || !workspace?.id) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [activitiesRes, leadsRes, notesRes] = await Promise.all([
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
          supabase
            .from('calendar_notes' as any)
            .select('id, date, content')
            .eq('user_id', user.id)
            .eq('workspace_id', workspace.id),
        ]);

        if (activitiesRes.error) throw activitiesRes.error;
        if (leadsRes.error) throw leadsRes.error;
        if (notesRes.error) throw notesRes.error;

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
            sourceId: a.id,
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
            sourceId: l.id,
            date: d,
            kind: 'prospection',
            title: l.next_action || 'Próxima ação',
            subtitle: l.company_name || 'Lead',
            leadId: l.id,
          });
        }


        if (active) {
          setEvents(list);
          setNotes(((notesRes.data || []) as any[]).map(n => ({ id: n.id, date: n.date, content: n.content })));
        }
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

  const notesByDay = useMemo(() => {
    const m = new Map<string, PersonalNote[]>();
    for (const n of notes) {
      if (!m.has(n.date)) m.set(n.date, []);
      m.get(n.date)!.push(n);
    }
    return m;
  }, [notes]);

  // Appointments filtered to the user (assigned or created)
  const myAppointments = useMemo(() => {
    if (!user?.id) return [];
    return appointments.filter(a => a.createdBy === user.id || (a.assignedTo || []).includes(user.id));
  }, [appointments, user?.id]);

  const apptsByDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    if (!showAppointments) return m;
    for (const a of myAppointments) {
      const key = format(a.startAt, 'yyyy-MM-dd');
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(a);
    }
    return m;
  }, [myAppointments, showAppointments]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const dropDate: Date | undefined = (over.data?.current as any)?.date;
    if (!dropDate) return;
    const data = active.data?.current as any;
    if (!data) return;

    const dropIso = format(dropDate, 'yyyy-MM-dd');

    if (data.type === 'activity') {
      const ev = events.find(x => x.id === data.eventId);
      if (!ev) return;
      const prev = events;
      setEvents(es => es.map(x => x.id === ev.id ? { ...x, date: dropDate } : x));
      const { error } = await supabase.from('project_activities').update({ due_date: dropIso }).eq('id', ev.sourceId);
      if (error) { toast.error('Erro ao mover atividade'); setEvents(prev); }
      else toast.success('Atividade movida');
    } else if (data.type === 'lead') {
      const ev = events.find(x => x.id === data.eventId);
      if (!ev) return;
      const prev = events;
      setEvents(es => es.map(x => x.id === ev.id ? { ...x, date: dropDate } : x));
      const { error } = await supabase.from('prospection_leads').update({ next_action_date: dropIso }).eq('id', ev.sourceId);
      if (error) { toast.error('Erro ao mover ação'); setEvents(prev); }
      else toast.success('Ação movida');
    } else if (data.type === 'appointment') {
      const a = myAppointments.find(x => x.id === data.appointmentId);
      if (!a) return;
      const oldDay = new Date(a.startAt); oldDay.setHours(0,0,0,0);
      const newDay = new Date(dropDate); newDay.setHours(0,0,0,0);
      const delta = differenceInCalendarDays(newDay, oldDay);
      if (delta === 0) return;
      const newStart = addDays(new Date(a.startAt), delta);
      const newEnd = a.endAt ? addDays(new Date(a.endAt), delta) : null;
      await updateAppt(a.id, { startAt: newStart, endAt: newEnd });
    }
  }, [events, myAppointments, updateAppt]);


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

  // ---- Notes CRUD ----
  const openNewNote = (date?: string) => {
    setEditingNote(null);
    setNoteDate(date || format(new Date(), 'yyyy-MM-dd'));
    setNoteContent('');
    setNoteDialogOpen(true);
  };

  const openEditNote = (n: PersonalNote) => {
    setEditingNote(n);
    setNoteDate(n.date);
    setNoteContent(n.content);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!user?.id || !workspace?.id) return;
    const content = noteContent.trim();
    if (!content) {
      toast.error('Escreva o conteúdo da nota');
      return;
    }
    if (!noteDate) {
      toast.error('Informe a data');
      return;
    }
    setSavingNote(true);
    try {
      if (editingNote) {
        const { error } = await supabase
          .from('calendar_notes' as any)
          .update({ content, date: noteDate })
          .eq('id', editingNote.id);
        if (error) throw error;
        setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, content, date: noteDate } : n));
        toast.success('Nota atualizada');
      } else {
        const { data, error } = await supabase
          .from('calendar_notes' as any)
          .insert({ user_id: user.id, workspace_id: workspace.id, date: noteDate, content } as any)
          .select('id, date, content')
          .single();
        if (error) throw error;
        const row = data as any;
        setNotes(prev => [...prev, { id: row.id, date: row.date, content: row.content }]);
        toast.success('Nota adicionada');
      }
      setNoteDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!editingNote) return;
    if (!confirm('Excluir esta nota?')) return;
    setSavingNote(true);
    try {
      const { error } = await supabase.from('calendar_notes' as any).delete().eq('id', editingNote.id);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== editingNote.id));
      setNoteDialogOpen(false);
      toast.success('Nota excluída');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao excluir nota');
    } finally {
      setSavingNote(false);
    }
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
        <div className="flex items-center gap-2">
          <Switch checked={showNotes} onCheckedChange={setShowNotes} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowNotes(v => !v)}>
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            Notas
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showAppointments} onCheckedChange={setShowAppointments} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowAppointments(v => !v)}>
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            Compromissos
          </label>
        </div>

        <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToday}>Hoje</Button>
        <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => openNewNote()}>
          <Plus className="w-3.5 h-3.5" /> Nota
        </Button>
        <Button size="sm" className="text-xs h-8 gap-1" onClick={() => { setEditingAppt(null); setCreateApptAt(null); setApptDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5" /> Compromisso
        </Button>
      </div>

      <div className="px-4 md:px-6 py-1.5 text-[11px] text-muted-foreground bg-muted/40 border-b border-border">
        Arraste itens para outro dia para reagendar.
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

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className={cn('grid grid-cols-7', view === 'month' ? 'auto-rows-fr' : '')}>
            {days.map((day, i) => {
              const inMonth = view === 'week' || isSameMonth(day, currentDate);
              const today = isToday(day);
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(key) || [];
              const dayNotes = showNotes ? (notesByDay.get(key) || []) : [];
              const dayAppts = apptsByDay.get(key) || [];

              return (
                <DayCell
                  key={i}
                  day={day}
                  inMonth={inMonth}
                  today={today}
                  view={view}
                  onAddNote={() => openNewNote(key)}
                  onCreateAppt={() => { setEditingAppt(null); setCreateApptAt(day); setApptDialogOpen(true); }}
                >
                  {dayEvents.map(ev => (
                    <DraggableEvent
                      key={ev.id}
                      ev={ev}
                      onOpen={() => handleOpen(ev)}
                    />
                  ))}
                  {dayAppts.map(ap => (
                    <DraggableAppointment
                      key={ap.id}
                      appt={ap}
                      onOpen={() => { setEditingAppt(ap); setApptDialogOpen(true); }}
                    />
                  ))}
                  {dayNotes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => openEditNote(n)}
                      className="w-full text-left rounded px-1.5 py-1 text-[10px] md:text-[11px] leading-tight border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                      title={n.content}
                    >
                      <div className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3 shrink-0" />
                        <span className="truncate">{n.content}</span>
                      </div>
                    </button>
                  ))}
                </DayCell>
              );
            })}
          </div>
        </DndContext>

        {!loading && events.length === 0 && notes.length === 0 && myAppointments.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade, ação, nota ou compromisso cadastrado.
          </div>
        )}
      </div>


      {/* Event detail dialog */}
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

      {/* Note editor dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-500" />
              {editingNote ? 'Editar nota' : 'Nova nota'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="note-date" className="text-xs">Data</Label>
              <Input
                id="note-date"
                type="date"
                value={noteDate}
                onChange={e => setNoteDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="note-content" className="text-xs">Nota</Label>
              <Textarea
                id="note-content"
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Escreva sua nota..."
                rows={5}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {editingNote && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteNote}
                disabled={savingNote}
                className="gap-1 mr-auto"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setNoteDialogOpen(false)} disabled={savingNote}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={savingNote} className="gap-1">
              <Pencil className="w-4 h-4" />
              {editingNote ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
