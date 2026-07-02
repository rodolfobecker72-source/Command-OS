import { Budget } from '@/types/crm';
import { Appointment, APPOINTMENT_KIND_COLORS, APPOINTMENT_KIND_LABELS } from '@/types/appointment';
import { useCRM } from '@/contexts/CRMContext';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';

export type CalendarEventType = 'execution' | 'delivery' | 'pending' | 'appointment' | 'activity';

export interface CalendarDeliveryEvent {
  id: string;
  date: Date;
  label: string;
  budget: Budget;
  type: 'delivery';
  serviceId?: string;
}

export interface CalendarActivityEvent {
  id: string;
  activityId: string;
  date: Date;
  title: string;
  status: string;
  budget: Budget;
  projectCardId: string;
  isDelivery?: boolean;
}

interface CalendarEventCardProps {
  /** Stable id used for drag identification */
  dragId?: string;
  /** Drag payload that the page-level handler will use to persist changes. */
  dragData?: Record<string, any>;
  budget?: Budget;
  appointment?: Appointment;
  activity?: CalendarActivityEvent;
  compact?: boolean;
  onClick?: () => void;
  eventType?: CalendarEventType;
  deliveryLabel?: string;
  disableDrag?: boolean;
}

export function CalendarEventCard({
  dragId,
  dragData,
  budget,
  appointment,
  activity,
  compact = false,
  onClick,
  eventType = 'execution',
  deliveryLabel,
  disableDrag,
}: CalendarEventCardProps) {
  const { clients } = useCRM();
  const client = budget ? clients.find(c => c.id === budget.clientId) : null;

  const draggable = useDraggable({
    id: dragId || `static-${Math.random()}`,
    data: dragData,
    disabled: disableDrag || !dragId,
  });

  const isDelivery = eventType === 'delivery';
  const isPending = eventType === 'pending';
  const isAppointment = eventType === 'appointment';
  const isActivity = eventType === 'activity';

  const apptColors = appointment ? APPOINTMENT_KIND_COLORS[appointment.kind] : null;

  const activityIsDelivery = isActivity && !!activity?.isDelivery;

  const statusStyle = isAppointment && apptColors
    ? cn(apptColors.bg, apptColors.border, apptColors.text)
    : isDelivery || activityIsDelivery
      ? 'bg-blue-500/15 border-blue-500/30 text-blue-600'
      : isActivity
        ? 'bg-primary/10 border-primary/25 text-primary'
      : isPending
        ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-600'
        : 'bg-success/15 border-success/30 text-success';

  const dotColor = isAppointment && apptColors
    ? apptColors.dot
    : isDelivery || activityIsDelivery ? 'bg-blue-500'
    : isActivity ? 'bg-primary'
    : isPending ? 'bg-yellow-500'
    : 'bg-success';

  // Build label
  let mainLabel = '';
  let timeLabel = '';
  if (isAppointment && appointment) {
    if (!appointment.allDay) timeLabel = format(appointment.startAt, 'HH:mm');
    mainLabel = appointment.title;
  } else if (isActivity && activity) {
    mainLabel = `✓ ${budget?.proposalId || ''} - ${activity.title}`;
  } else if (isDelivery) {
    mainLabel = deliveryLabel || '';
  } else if (budget) {
    if (budget.executionStartTime) timeLabel = budget.executionStartTime;
    mainLabel = `${budget.proposalId} - ${budget.projectName}`;
  }

  const dragStyle = draggable.transform
    ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
        opacity: 0.85,
        zIndex: 50,
      }
    : undefined;

  const baseClasses = cn(
    'w-full text-left border transition-opacity active:scale-[0.97]',
    statusStyle,
    !disableDrag && dragId && 'cursor-grab active:cursor-grabbing',
    draggable.isDragging && 'opacity-50',
  );

  if (compact) {
    return (
      <button
        ref={draggable.setNodeRef as any}
        style={dragStyle}
        {...draggable.listeners}
        {...draggable.attributes}
        onClick={(e) => { if (!draggable.isDragging) onClick?.(); e.stopPropagation(); }}
        className={cn(baseClasses, 'px-1.5 py-0.5 rounded text-[10px] leading-tight font-semibold truncate flex items-center gap-1 hover:opacity-80')}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
        {timeLabel && <span className="text-foreground/70 font-semibold shrink-0">{timeLabel}</span>}
        <span className="truncate text-foreground">{mainLabel}</span>
      </button>
    );
  }

  return (
    <button
      ref={draggable.setNodeRef as any}
      style={dragStyle}
      {...draggable.listeners}
      {...draggable.attributes}
      onClick={(e) => { if (!draggable.isDragging) onClick?.(); e.stopPropagation(); }}
      className={cn(baseClasses, 'px-2 py-1.5 rounded-md shadow-sm hover:shadow-md space-y-0.5')}
      title={isAppointment && appointment ? APPOINTMENT_KIND_LABELS[appointment.kind] : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
        {timeLabel && <span className="text-foreground/70 text-[11px] font-semibold shrink-0">{timeLabel}</span>}
        <span className="text-xs font-semibold truncate text-foreground">{mainLabel}</span>
      </div>
      {isAppointment && appointment?.location && (
        <p className="text-[10px] text-muted-foreground truncate pl-3.5">{appointment.location}</p>
      )}
      {isActivity && activity && (
        <p className="text-[10px] text-muted-foreground truncate pl-3.5">{activity.budget.projectName}</p>
      )}
      {!isAppointment && !isActivity && client && (
        <p className="text-[10px] text-muted-foreground truncate pl-3.5">{client.companyName}</p>
      )}
    </button>
  );
}
