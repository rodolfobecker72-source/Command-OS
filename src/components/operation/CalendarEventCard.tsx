import { Budget } from '@/types/crm';
import { useCRM } from '@/contexts/CRMContext';
import { cn } from '@/lib/utils';

export type CalendarEventType = 'execution' | 'delivery';

export interface CalendarDeliveryEvent {
  id: string;
  date: Date;
  label: string; // e.g. "CINE - Entrega"
  budget: Budget;
  type: 'delivery';
}

interface CalendarEventCardProps {
  budget: Budget;
  compact?: boolean;
  onClick?: () => void;
  eventType?: CalendarEventType;
  deliveryLabel?: string;
}

export function CalendarEventCard({ budget, compact = false, onClick, eventType = 'execution', deliveryLabel }: CalendarEventCardProps) {
  const { clients } = useCRM();
  const client = clients.find(c => c.id === budget.clientId);

  const isDelivery = eventType === 'delivery';
  const statusStyle = isDelivery
    ? 'bg-blue-500/15 border-blue-500/30 text-blue-600'
    : 'bg-success/15 border-success/30 text-success';
  const dotColor = isDelivery ? 'bg-blue-500' : 'bg-success';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight font-semibold truncate flex items-center gap-1 hover:opacity-80 transition-opacity active:scale-[0.97] border',
          statusStyle,
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
        <span className="truncate text-foreground">
          {isDelivery ? deliveryLabel : `${budget.proposalId} - ${budget.projectName}`}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded-md border shadow-sm hover:shadow-md transition-shadow active:scale-[0.97] space-y-0.5',
        statusStyle,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
        <span className="text-xs font-semibold truncate text-foreground">
          {isDelivery ? deliveryLabel : `${budget.proposalId} - ${budget.projectName}`}
        </span>
      </div>
      {client && (
        <p className="text-[10px] text-muted-foreground truncate pl-3.5">
          {client.companyName}
        </p>
      )}
    </button>
  );
}
