import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Budget } from '@/types/crm';
import { CalendarEventCard, CalendarDeliveryEvent } from './CalendarEventCard';
import { cn } from '@/lib/utils';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: Budget[];
  deliveryEvents: CalendarDeliveryEvent[];
  onEventClick: (budget: Budget) => void;
  onDeliveryClick?: (budget: Budget, serviceId?: string) => void;
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

function getDeliveryEventsForDay(day: Date, deliveryEvents: CalendarDeliveryEvent[]): CalendarDeliveryEvent[] {
  return deliveryEvents.filter(ev => isSameDay(ev.date, day));
}

export function CalendarWeekView({ currentDate, events, deliveryEvents, onEventClick, onDeliveryClick }: CalendarWeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekEnd = endOfWeek(currentDate, { locale: ptBR });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                'py-3 text-center border-r border-border last:border-r-0',
                today && 'bg-primary/5',
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div
                className={cn(
                  'text-lg font-bold mt-0.5 w-9 h-9 flex items-center justify-center rounded-full mx-auto',
                  today && 'bg-primary text-primary-foreground',
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 flex-1">
        {days.map((day, i) => {
          const today = isToday(day);
          const dayEvents = getEventsForDay(day, events);
          const dayDeliveries = getDeliveryEventsForDay(day, deliveryEvents);

          return (
            <div
              key={i}
              className={cn(
                'border-r border-border last:border-r-0 p-1.5 space-y-1.5 overflow-y-auto',
                today && 'bg-primary/5',
              )}
            >
              {dayEvents.length === 0 && dayDeliveries.length === 0 && (
                <p className="text-[10px] text-muted-foreground/40 text-center pt-4">—</p>
              )}
              {dayEvents.map(ev => (
                <CalendarEventCard
                  key={ev.id}
                  budget={ev}
                  onClick={() => onEventClick(ev)}
                />
              ))}
              {dayDeliveries.map(ev => (
                <CalendarEventCard
                  key={ev.id}
                  budget={ev.budget}
                  eventType="delivery"
                  deliveryLabel={ev.label}
                  onClick={() => onEventClick(ev.budget)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
