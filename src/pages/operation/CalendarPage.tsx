import { useState, useMemo, useCallback } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEventCard } from '@/components/operation/CalendarEventCard';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/contexts/CRMContext';
import { Budget, formatCurrency } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarMonthView } from '@/components/operation/CalendarMonthView';
import { CalendarWeekView } from '@/components/operation/CalendarWeekView';
import { Header } from '@/components/layout/Header';

export function CalendarPage() {
  const { budgets, clients, getStatusLabel } = useCRM();
  const navigate = useNavigate();

  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Filter budgets that have execution start date set (regardless of hasExecutionDate flag)
  const calendarEvents = useMemo(
    () => budgets.filter(b => b.executionStartDate),
    [budgets],
  );

  // Budgets with executionMonth matching current view but no specific start date
  const currentYearMonth = format(currentDate, 'yyyy-MM');
  const undatedEvents = useMemo(
    () => budgets.filter(b => b.executionMonth === currentYearMonth && !b.executionStartDate),
    [budgets, currentYearMonth],
  );

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () =>
    setCurrentDate(d => (view === 'month' ? subMonths(d, 1) : subWeeks(d, 1)));

  const goNext = () =>
    setCurrentDate(d => (view === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));

  const headerLabel =
    view === 'month'
      ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
      : `Semana de ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })}`;

  const handleEventClick = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
  }, []);

  const client = selectedBudget
    ? clients.find(c => c.id === selectedBudget.clientId)
    : null;

  const getBudgetValue = (b: Budget) => {
    if (b.finalValue) return b.finalValue;
    const latestVersion = b.versions?.length ? b.versions[b.versions.length - 1] : null;
    return latestVersion?.fullPrice || 0;
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendário" />

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-border bg-card">
        {/* View toggle */}
        <Tabs value={view} onValueChange={v => setView(v as 'month' | 'week')}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs px-3 h-7">Mês</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3 h-7">Semana</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="text-sm md:text-base font-semibold capitalize flex-1">{headerLabel}</h2>

        <Button variant="outline" size="sm" className="text-xs h-8" onClick={goToday}>
          Hoje
        </Button>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto bg-card">
        {view === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            events={calendarEvents}
            onEventClick={handleEventClick}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            events={calendarEvents}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Undated projects for the current month */}
      {undatedEvents.length > 0 && (
        <div className="border-t border-border bg-card px-4 md:px-6 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Projetos previstos para {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })} — sem data definida
          </h3>
          <div className="flex flex-col gap-2 max-w-md">
            {undatedEvents.map(budget => (
              <CalendarEventCard
                key={budget.id}
                budget={budget}
                onClick={() => handleEventClick(budget)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Event detail dialog */}
      <Dialog open={!!selectedBudget} onOpenChange={open => !open && setSelectedBudget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {selectedBudget?.proposalId}
            </DialogTitle>
          </DialogHeader>

          {selectedBudget && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Projeto</p>
                <p className="font-medium">{selectedBudget.projectName}</p>
              </div>
              {client && (
                <div>
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="font-medium">{client.companyName}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-medium">{getStatusLabel(selectedBudget.status)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor</p>
                  <p className="font-medium">{formatCurrency(getBudgetValue(selectedBudget))}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Início</p>
                  <p className="font-medium">
                    {selectedBudget.executionStartDate
                      ? format(new Date(selectedBudget.executionStartDate), 'dd/MM/yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fim</p>
                  <p className="font-medium">
                    {selectedBudget.executionEndDate
                      ? format(new Date(selectedBudget.executionEndDate), 'dd/MM/yyyy')
                      : '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Local</p>
                <p className="font-medium">{selectedBudget.location || '—'}</p>
              </div>

              <Button
                className="w-full mt-2"
                size="sm"
                onClick={() => {
                  setSelectedBudget(null);
                  navigate(`/crm/orcamento/${selectedBudget.id}`);
                }}
              >
                Ver orçamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
