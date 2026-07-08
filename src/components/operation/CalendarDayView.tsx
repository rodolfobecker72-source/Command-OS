import { useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Budget } from '@/types/crm';
import { Appointment } from '@/types/appointment';
import { CalendarEventCard, CalendarActivityEvent, CalendarDeliveryEvent } from './CalendarEventCard';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

interface CalendarDayViewProps {
  currentDate: Date;
  events: Budget[];
  pendingEvents?: Budget[];
  deliveryEvents: CalendarDeliveryEvent[];
  activityEvents?: CalendarActivityEvent[];
  appointments?: Appointment[];
  onEventClick: (budget: Budget) => void;
  onDeliveryClick?: (budget: Budget, serviceId?: string) => void;
  onActivityClick?: (activity: CalendarActivityEvent) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDragEndDay?: (event: DragEndEvent) => void;
  onCreateAppointmentAt?: (date: Date) => void;
}

function getEventsForDay(day: Date, events: Budget[]): Budget[] {
  return events.filter(b => {
    if (!b.executionStartDate) return false;
    const start = new Date(b.executionStartDate);
    start.setHours(0, 0, 0, 0);
    const end = b.executionEndDate ? new Date(b.executionEndDate) : new Date(start);
    end.setHours(23, 59, 59, 999);
    const d = new Date(day);
    d.setHours(12, 0, 0, 0);
    return d >= start && d <= end;
  });
}

function DroppableDay({ day, children, onCreate, className }: { day: Date; children: React.ReactNode; onCreate?: () => void; className?: string }) {
  const id = `day-${format(day, 'yyyy-MM-dd')}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { date: day } });
  return (
    <div
      ref={setNodeRef}
      onDoubleClick={onCreate}
      className={cn(className, isOver && 'ring-2 ring-primary/40 bg-primary/10')}
    >
      {children}
    </div>
  );
}

export function CalendarDayView({
  currentDate, events, pendingEvents = [], deliveryEvents, activityEvents = [], appointments = [],
  onEventClick, onDeliveryClick, onActivityClick, onAppointmentClick, onDragEndDay, onCreateAppointmentAt,
}: CalendarDayViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const dayEvents = useMemo(() => getEventsForDay(currentDate, events), [currentDate, events]);
  const dayPending = useMemo(() => getEventsForDay(currentDate, pendingEvents), [currentDate, pendingEvents]);
  const dayDeliveries = useMemo(() => deliveryEvents.filter(ev => isSameDay(ev.date, currentDate)), [currentDate, deliveryEvents]);
  const dayActivities = useMemo(() => activityEvents.filter(ev => isSameDay(ev.date, currentDate)), [currentDate, activityEvents]);
  const dayAppts = useMemo(() => appointments.filter(a => isSameDay(a.startAt, currentDate)), [currentDate, appointments]);

  const total = dayEvents.length + dayPending.length + dayDeliveries.length + dayActivities.length + dayAppts.length;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEndDay}>
      <div className="flex flex-col h-full">
        <div className="px-4 md:px-6 py-3 border-b border-border bg-card">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </p>
          <h3 className="text-lg md:text-xl font-bold capitalize">
            {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>

        <DroppableDay
          day={currentDate}
          onCreate={onCreateAppointmentAt ? () => onCreateAppointmentAt(currentDate) : undefined}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-2"
        >
          {total === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-12">
              Nada agendado para este dia. Duplo clique para criar um compromisso.
            </div>
          )}
          {dayEvents.map(ev => (
            <CalendarEventCard
              key={ev.id}
              dragId={`bg-${ev.id}`}
              dragData={{ type: 'budget', budgetId: ev.id }}
              budget={ev}
              onClick={() => onEventClick(ev)}
            />
          ))}
          {dayPending.map(ev => (
            <CalendarEventCard
              key={`pending-${ev.id}`}
              dragId={`bg-${ev.id}`}
              dragData={{ type: 'budget', budgetId: ev.id }}
              budget={ev}
              eventType="pending"
              onClick={() => onEventClick(ev)}
            />
          ))}
          {dayDeliveries.map(ev => (
            <CalendarEventCard
              key={ev.id}
              dragId={`del-${ev.id}`}
              dragData={{ type: 'delivery', budgetId: ev.budget.id, serviceId: ev.serviceId }}
              budget={ev.budget}
              eventType="delivery"
              deliveryLabel={ev.label}
              onClick={() => onDeliveryClick ? onDeliveryClick(ev.budget, ev.serviceId) : onEventClick(ev.budget)}
            />
          ))}
          {dayActivities.map(ev => (
            <CalendarEventCard
              key={ev.id}
              dragId={`act-${ev.id}`}
              dragData={{ type: 'activity', activityId: ev.activityId }}
              budget={ev.budget}
              activity={ev}
              eventType="activity"
              onClick={() => onActivityClick ? onActivityClick(ev) : onEventClick(ev.budget)}
            />
          ))}
          {dayAppts.map(ap => (
            <CalendarEventCard
              key={ap.id}
              dragId={`ap-${ap.id}`}
              dragData={{ type: 'appointment', appointmentId: ap.id }}
              appointment={ap}
              eventType="appointment"
              onClick={() => onAppointmentClick?.(ap)}
            />
          ))}
        </DroppableDay>
      </div>
    </DndContext>
  );
}
