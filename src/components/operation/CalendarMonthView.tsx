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
import { CalendarEventCard } from './CalendarEventCard';
import { cn } from '@/lib/utils';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: Budget[];
  onEventClick: (budget: Budget) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getEventsForDay(day: Date, events: Budget[]): Budget[] {
  return events.filter(b => {
    if (!b.executionStartDate) return false;
    const start = new Date(b.executionStartDate);
    start.setHours(0, 0, 0, 0);
    const end = b.executionEndDate ? new Date(b.executionEndDate) : start;
    end.setHours(23, 59, 59, 999);
    const d = new Date(day);
    d.setHours(12, 0, 0, 0);
    return d >= start && d <= end;
  });
}

export function CalendarMonthView({ currentDate, events, onEventClick }: CalendarMonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const dayEvents = getEventsForDay(day, events);

          return (
            <div
              key={i}
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
                    budget={ev}
                    compact
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
