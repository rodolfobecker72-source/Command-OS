import { useState, useMemo, useCallback } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, format, addDays, addBusinessDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEventCard, CalendarDeliveryEvent } from '@/components/operation/CalendarEventCard';
import { ChevronLeft, ChevronRight, CalendarDays, Package, Download, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/contexts/CRMContext';
import { Budget } from '@/types/crm';
import { Appointment } from '@/types/appointment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { CalendarMonthView } from '@/components/operation/CalendarMonthView';
import { CalendarWeekView } from '@/components/operation/CalendarWeekView';
import { AppointmentDialog } from '@/components/operation/AppointmentDialog';
import { Header } from '@/components/layout/Header';
import { generateProjectPDF } from '@/utils/projectPDF';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppointments } from '@/hooks/useAppointments';
import { DragEndEvent } from '@dnd-kit/core';

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
      let deliveryDate: Date;
      if (svc.deliveryType === 'data_especifica' && (svc as any).deliveryDate) {
        deliveryDate = new Date((svc as any).deliveryDate + 'T12:00:00');
      } else if (!execStart) {
        continue;
      } else if (svc.deliveryType === 'realtime') {
        deliveryDate = new Date(execStart);
      } else if (svc.deliveryType === 'dias_uteis' && svc.deliveryDays) {
        deliveryDate = addBusinessDays(execStart, svc.deliveryDays);
        deliveryDate = addDays(deliveryDate, -1);
      } else if (svc.deliveryType === 'dias_corridos' && svc.deliveryDays) {
        deliveryDate = addDays(execStart, svc.deliveryDays);
        deliveryDate = addDays(deliveryDate, -1);
      } else {
        continue;
      }

      events.push({
        id: `${b.id}-delivery-${svc.id}`,
        date: deliveryDate,
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

export function CalendarPage() {
  const { budgets, clients, updateBudget, updateBudgetVersion } = useCRM();
  const navigate = useNavigate();
  const { appointments, create: createAppointment, update: updateAppointment, remove: removeAppointment } = useAppointments();

  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showDeliveries, setShowDeliveries] = useState(true);
  const [showAppointments, setShowAppointments] = useState(true);

  const [apptDialogOpen, setApptDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [createAtDate, setCreateAtDate] = useState<Date | null>(null);

  // For editing budget date/time inline
  const [editingDates, setEditingDates] = useState(false);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const approvedBudgets = useMemo(() => budgets.filter(b => b.status === 'aprovada'), [budgets]);
  const pendingBudgets = useMemo(
    () => budgets.filter(b => b.status !== 'aprovada' && b.status !== 'nao_aprovada' && b.executionStartDate),
    [budgets],
  );
  const calendarEvents = useMemo(() => approvedBudgets.filter(b => b.executionStartDate), [approvedBudgets]);
  const deliveryEvents = useMemo(() => computeDeliveryEvents(approvedBudgets), [approvedBudgets]);

  const currentYearMonth = format(currentDate, 'yyyy-MM');
  const undatedEvents = useMemo(
    () => approvedBudgets.filter(b => b.executionMonth === currentYearMonth && !b.executionStartDate),
    [approvedBudgets, currentYearMonth],
  );

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(d => (view === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));
  const goNext = () => setCurrentDate(d => (view === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));

  const headerLabel = view === 'month'
    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    : `Semana de ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })}`;

  const openBudget = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
    setSelectedServiceId(null);
    setEditingDates(false);
    setEditStart(budget.executionStartDate ? toIsoDateOnly(new Date(budget.executionStartDate)) : '');
    setEditEnd(budget.executionEndDate ? toIsoDateOnly(new Date(budget.executionEndDate)) : '');
    setEditStartTime(budget.executionStartTime || '');
    setEditEndTime(budget.executionEndTime || '');
  }, []);

  const handleDeliveryClick = useCallback((budget: Budget, serviceId?: string) => {
    setSelectedBudget(budget);
    setSelectedServiceId(serviceId || null);
  }, []);

  const client = selectedBudget ? clients.find(c => c.id === selectedBudget.clientId) : null;

  const handleDownloadPDF = useCallback(async () => {
    if (!selectedBudget || !client) return;
    try {
      const { data: layoutData } = await supabase.from('workspace_layout').select('*').single();
      const layoutSettings = layoutData ? {
        logoUrl: layoutData.logo_url,
        companyName: layoutData.company_name,
        website: layoutData.website,
        email: layoutData.email,
      } : null;
      await generateProjectPDF({ budget: selectedBudget, client, layoutSettings });
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error(err); toast.error('Erro ao gerar PDF');
    }
  }, [selectedBudget, client]);

  // ===== Drag end handler =====
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
      const oldStartDay = new Date(oldStart); oldStartDay.setHours(0,0,0,0);
      const newStartDay = new Date(dropDate); newStartDay.setHours(0,0,0,0);
      const delta = differenceInCalendarDays(newStartDay, oldStartDay);
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
    } else if (data.type === 'appointment') {
      const a = appointments.find(x => x.id === data.appointmentId);
      if (!a) return;
      const oldStart = new Date(a.startAt);
      const oldDay = new Date(oldStart); oldDay.setHours(0,0,0,0);
      const newDay = new Date(dropDate); newDay.setHours(0,0,0,0);
      const delta = differenceInCalendarDays(newDay, oldDay);
      if (delta === 0) return;
      const newStart = addDays(oldStart, delta);
      const newEnd = a.endAt ? addDays(new Date(a.endAt), delta) : null;
      await updateAppointment(a.id, { startAt: newStart, endAt: newEnd });
    }
  }, [budgets, appointments, updateBudget, updateBudgetVersion, updateAppointment]);

  const handleOpenNewAppointment = (date?: Date) => {
    setEditingAppt(null);
    setCreateAtDate(date ?? null);
    setApptDialogOpen(true);
  };

  const handleSaveBudgetDates = async () => {
    if (!selectedBudget) return;
    const startDate = editStart ? new Date(editStart + 'T12:00:00') : null;
    const endDate = editEnd ? new Date(editEnd + 'T12:00:00') : null;
    if (endDate && startDate && endDate < startDate) {
      toast.error('Fim deve ser depois do início'); return;
    }
    await updateBudget(selectedBudget.id, {
      executionStartDate: startDate,
      executionEndDate: endDate,
      executionStartTime: editStartTime || null,
      executionEndTime: editEndTime || null,
      executionMonth: startDate ? format(startDate, 'yyyy-MM') : selectedBudget.executionMonth,
    });
    toast.success('Datas atualizadas');
    setEditingDates(false);
    // refresh local selection
    const updated = { ...selectedBudget, executionStartDate: startDate, executionEndDate: endDate, executionStartTime: editStartTime || null, executionEndTime: editEndTime || null };
    setSelectedBudget(updated);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendário de Projetos" />

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-border bg-card">
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
        <div className="flex items-center gap-2">
          <Switch checked={showAppointments} onCheckedChange={setShowAppointments} className="scale-90" />
          <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer" onClick={() => setShowAppointments(v => !v)}>
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" /> Compromissos
          </label>
        </div>

        <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToday}>Hoje</Button>
        <Button size="sm" className="text-xs h-8 gap-1" onClick={() => handleOpenNewAppointment()}>
          <Plus className="w-3.5 h-3.5" /> Compromisso
        </Button>
      </div>

      <div className="px-4 md:px-6 py-1.5 text-[11px] text-muted-foreground bg-muted/40 border-b border-border">
        Arraste qualquer card para outro dia para reagendar. Duplo clique em um dia cria um compromisso.
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto bg-card">
        {view === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            events={calendarEvents}
            pendingEvents={pendingBudgets}
            deliveryEvents={showDeliveries ? deliveryEvents : []}
            appointments={showAppointments ? appointments : []}
            onEventClick={openBudget}
            onDeliveryClick={handleDeliveryClick}
            onAppointmentClick={(a) => { setEditingAppt(a); setApptDialogOpen(true); }}
            onDragEndDay={handleDragEnd}
            onCreateAppointmentAt={handleOpenNewAppointment}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            events={calendarEvents}
            pendingEvents={pendingBudgets}
            deliveryEvents={showDeliveries ? deliveryEvents : []}
            appointments={showAppointments ? appointments : []}
            onEventClick={openBudget}
            onDeliveryClick={handleDeliveryClick}
            onAppointmentClick={(a) => { setEditingAppt(a); setApptDialogOpen(true); }}
            onDragEndDay={handleDragEnd}
            onCreateAppointmentAt={handleOpenNewAppointment}
          />
        )}
      </div>

      {/* Undated projects */}
      {undatedEvents.length > 0 && (
        <div className="border-t border-border bg-card px-4 md:px-6 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Projetos previstos para {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })} — sem data definida
          </h3>
          <div className="flex flex-col gap-2 max-w-md">
            {undatedEvents.map(budget => (
              <CalendarEventCard key={budget.id} budget={budget} onClick={() => openBudget(budget)} disableDrag />
            ))}
          </div>
        </div>
      )}

      {/* Event detail dialog */}
      <Dialog open={!!selectedBudget} onOpenChange={open => { if (!open) { setSelectedBudget(null); setSelectedServiceId(null); setEditingDates(false); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {selectedServiceId ? <Package className="w-5 h-5 text-blue-500" /> : <CalendarDays className="w-5 h-5 text-primary" />}
                {selectedBudget?.proposalId} - {selectedBudget?.projectName}
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1.5 mr-6" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>
          </DialogHeader>

          {selectedBudget && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {client && (
                  <div>
                    <p className="text-muted-foreground text-xs">Cliente</p>
                    <p className="font-medium">{client.companyName}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Local</p>
                  <p className="font-medium">{selectedBudget.location || '—'}</p>
                </div>
              </div>

              {/* Dates / times block */}
              <div className="border border-border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Execução</p>
                  {!editingDates ? (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDates(true)}>Editar datas</Button>
                  ) : (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveBudgetDates}>
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </Button>
                  )}
                </div>
                {!editingDates ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Início</p>
                      <p className="font-medium">
                        {selectedBudget.executionStartDate ? format(new Date(selectedBudget.executionStartDate), 'dd/MM/yyyy') : '—'}
                        {selectedBudget.executionStartTime ? ` às ${selectedBudget.executionStartTime}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Fim</p>
                      <p className="font-medium">
                        {selectedBudget.executionEndDate ? format(new Date(selectedBudget.executionEndDate), 'dd/MM/yyyy') : '—'}
                        {selectedBudget.executionEndTime ? ` às ${selectedBudget.executionEndTime}` : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Início</Label>
                        <Input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Hora início</Label>
                        <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Fim</Label>
                        <Input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Hora fim</Label>
                        <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} />
                      </div>
                    </div>
                    {(() => {
                      const outOfHours =
                        (editStartTime && (editStartTime < '08:00' || editStartTime > '18:00')) ||
                        (editEndTime && (editEndTime < '08:00' || editEndTime > '18:00'));
                      const lateDelivery = editEndTime && editEndTime > '18:00';
                      return (
                        <div className={`rounded-md border p-3 text-xs ${outOfHours ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-muted bg-muted/30 text-muted-foreground'}`}>
                          <strong>Horário comercial:</strong> entregas de projetos ao cliente devem ocorrer no máximo entre <strong>17h e 18h</strong>, preservando o horário comercial (08h–18h).
                          {lateDelivery && <div className="mt-1 font-medium">⚠ A hora de fim está fora do horário comercial.</div>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {selectedServiceId ? (() => {
                const approvedVer = selectedBudget.approvedVersion != null
                  ? selectedBudget.versions?.find(v => v.version === selectedBudget.approvedVersion)
                  : null;
                const latestVersion = approvedVer
                  || (selectedBudget.versions?.length ? [...selectedBudget.versions].sort((a, c) => c.version - a.version)[0] : null);
                const svc = latestVersion?.services?.find((s: any) => s.id === selectedServiceId);
                if (!svc) return null;
                return (
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">Entrega — Serviço</p>
                    <div className="bg-muted/50 rounded-md p-3 space-y-1">
                      <p className="font-semibold text-xs text-primary">
                        {svc.serviceType}{svc.objective ? ` — ${svc.objective}` : ''}
                      </p>
                      {svc.description && (
                        <p className="text-foreground whitespace-pre-line leading-relaxed text-xs">{svc.description}</p>
                      )}
                      {svc.deliveryType && (
                        <p className="text-muted-foreground text-[10px] mt-1">
                          Prazo: {
                            svc.deliveryType === 'realtime' ? 'Real time' :
                            svc.deliveryType === 'data_especifica' ? ((svc as any).deliveryDate || 'Data específica') :
                            `${svc.deliveryDays} ${svc.deliveryType === 'dias_uteis' ? 'dias úteis' : 'dias corridos'}`
                          }
                          {(svc as any).deliveryTime ? ` às ${(svc as any).deliveryTime}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <>
                  {selectedBudget.projectDescription && (
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Briefing do Projeto</p>
                      <p className="text-foreground whitespace-pre-line leading-relaxed bg-muted/50 rounded-md p-3">{selectedBudget.projectDescription}</p>
                    </div>
                  )}
                  {selectedBudget.objective && (
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Objetivo</p>
                      <p className="text-foreground whitespace-pre-line leading-relaxed bg-muted/50 rounded-md p-3">{selectedBudget.objective}</p>
                    </div>
                  )}
                  {(() => {
                    const approvedVer2 = selectedBudget.approvedVersion != null
                      ? selectedBudget.versions?.find(v => v.version === selectedBudget.approvedVersion)
                      : null;
                    const latestVersion = approvedVer2
                      || (selectedBudget.versions?.length ? [...selectedBudget.versions].sort((a, c) => c.version - a.version)[0] : null);
                    if (!latestVersion?.services?.length) return null;
                    return (
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">Serviços</p>
                        <div className="space-y-2">
                          {latestVersion.services.map((svc: any, idx: number) => (
                            <div key={svc.id || idx} className="bg-muted/50 rounded-md p-3 space-y-1">
                              <p className="font-semibold text-xs text-primary">
                                {svc.serviceType}{svc.objective ? ` — ${svc.objective}` : ''}
                              </p>
                              {svc.description && (
                                <p className="text-foreground whitespace-pre-line leading-relaxed text-xs">{svc.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment dialog */}
      <AppointmentDialog
        open={apptDialogOpen}
        onOpenChange={setApptDialogOpen}
        initial={editingAppt}
        defaultDate={createAtDate}
        onCreate={createAppointment}
        onUpdate={updateAppointment}
        onDelete={removeAppointment}
      />
    </div>
  );
}
