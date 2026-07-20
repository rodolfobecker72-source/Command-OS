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
import { CalendarEventCard, CalendarActivityEvent, CalendarDeliveryEvent } from './CalendarEventCard';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { MemberColor } from '@/utils/memberColors';

interface CalendarMonthViewProps {
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
  onDayClick?: (date: Date) => void;
  memberColorMap?: Map<string, MemberColor>;
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

function getActivityEventsForDay(day: Date, activityEvents: CalendarActivityEvent[]): CalendarActivityEvent[] {
  return activityEvents.filter(ev => isSameDay(ev.date, day));
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
  currentDate, events, pendingEvents = [], deliveryEvents, activityEvents = [], appointments = [],
  onEventClick, onDeliveryClick, onActivityClick, onAppointmentClick, onDragEndDay, onCreateAppointmentAt, onDayClick,
  memberColorMap,
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
      <div className="flex flex-col h-full min-h-0">
        <div className="grid grid-cols-7 border-b border-border shrink-0">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr min-h-0">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const dayEvents = getEventsForDay(day, events);
            const dayPending = getEventsForDay(day, pendingEvents);
            const dayDeliveries = getDeliveryEventsForDay(day, deliveryEvents);
            const allDayActivities = getActivityEventsForDay(day, activityEvents);
            const captacaoActivities = allDayActivities.filter(a => a.isCaptacao);
            const deliveryActivities = allDayActivities.filter(a => !a.isCaptacao && a.isDelivery);
            const otherActivities = allDayActivities.filter(a => !a.isCaptacao && !a.isDelivery);
            const dayAppts = getAppointmentsForDay(day, appointments);

            const renderActivity = (ev: CalendarActivityEvent) => (
              <CalendarEventCard
                key={ev.id}
                dragId={`act-${ev.id}`}
                dragData={{ type: 'activity', activityId: ev.activityId }}
                budget={ev.budget}
                activity={ev}
                compact
                eventType="activity"
                memberColor={ev.assignedUserId ? memberColorMap?.get(ev.assignedUserId) : undefined}
                onClick={() => onActivityClick ? onActivityClick(ev) : onEventClick(ev.budget)}
              />
            );

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
                  <button
                    type="button"
                    onClick={() => onDayClick?.(day)}
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors',
                      today && 'bg-primary text-primary-foreground',
                      !inMonth && 'text-muted-foreground/50',
                      onDayClick && 'hover:bg-primary/20 cursor-pointer',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                </div>
                <div className="space-y-0.5 overflow-y-auto max-h-[52px] md:max-h-[76px] scrollbar-thin">
                  {captacaoActivities.map(renderActivity)}
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
                  {deliveryActivities.map(renderActivity)}
                  {otherActivities.map(renderActivity)}
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
