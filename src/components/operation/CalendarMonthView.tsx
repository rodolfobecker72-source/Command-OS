import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Budget } from '@/types/crm';
import { Appointment } from '@/types/appointment';
import { CalendarEventCard, CalendarDeliveryEvent } from './CalendarEventCard';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: Budget[];
  pendingEvents?: Budget[];
  deliveryEvents: CalendarDeliveryEvent[];
  appointments?: Appointment[];
  onEventClick: (budget: Budget) => void;
  onDeliveryClick?: (budget: Budget, serviceId?: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDragEndDay?: (event: DragEndEvent) => void;
  onCreateAppointmentAt?: (date: Date) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

function getDeliveryEventsForDay(day: Date, deliveryEvents: CalendarDeliveryEvent[]): CalendarDeliveryEvent[] {
  return deliveryEvents.filter(ev => isSameDay(ev.date, day));
}

function getAppointmentsForDay(day: Date, appts: Appointment[]): Appointment[] {
  return appts.filter(a => isSameDay(a.startAt, day));
}

function DroppableDay({ day, children, onCreate, ...rest }: { day: Date; children: React.ReactNode; onCreate?: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  const id = `day-${format(day, 'yyyy-MM-dd')}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { date: day } });
  return (
    <div
      ref={setNodeRef}
      {...rest}
      className={cn(rest.className, isOver && 'ring-2 ring-primary/40 bg-primary/10')}
      onDoubleClick={onCreate}
    >
      {children}
    </div>
  );
}

export function CalendarMonthView({
  currentDate, events, pendingEvents = [], deliveryEvents, appointments = [],
  onEventClick, onDeliveryClick, onAppointmentClick, onDragEndDay, onCreateAppointmentAt,
}: CalendarMonthViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEndDay}>
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const dayEvents = getEventsForDay(day, events);
            const dayPending = getEventsForDay(day, pendingEvents);
            const dayDeliveries = getDeliveryEventsForDay(day, deliveryEvents);
            const dayAppts = getAppointmentsForDay(day, appointments);

            return (
              <DroppableDay
                key={i}
                day={day}
                onCreate={onCreateAppointmentAt ? () => onCreateAppointmentAt(day) : undefined}
                className={cn(
                  'border-b border-r border-border p-1 min-h-[72px] md:min-h-[100px] overflow-hidden transition-colors',
                  !inMonth && 'bg-muted/30',
                  today && 'bg-primary/5',
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      today && 'bg-primary text-primary-foreground',
                      !inMonth && 'text-muted-foreground/50',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-0.5 overflow-y-auto max-h-[52px] md:max-h-[76px] scrollbar-thin">
                  {dayEvents.map(ev => (
                    <CalendarEventCard
                      key={ev.id}
                      dragId={`bg-${ev.id}`}
                      dragData={{ type: 'budget', budgetId: ev.id }}
                      budget={ev}
                      compact
                      onClick={() => onEventClick(ev)}
                    />
                  ))}
                  {dayPending.map(ev => (
                    <CalendarEventCard
                      key={`pending-${ev.id}`}
                      dragId={`bg-${ev.id}`}
                      dragData={{ type: 'budget', budgetId: ev.id }}
                      budget={ev}
                      compact
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
                      compact
                      eventType="delivery"
                      deliveryLabel={ev.label}
                      onClick={() => onDeliveryClick ? onDeliveryClick(ev.budget, ev.serviceId) : onEventClick(ev.budget)}
                    />
                  ))}
                  {dayAppts.map(ap => (
                    <CalendarEventCard
                      key={ap.id}
                      dragId={`ap-${ap.id}`}
                      dragData={{ type: 'appointment', appointmentId: ap.id }}
                      appointment={ap}
                      compact
                      eventType="appointment"
                      onClick={() => onAppointmentClick?.(ap)}
                    />
                  ))}
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
