import { Budget } from '@/types/crm';
import { useCRM } from '@/contexts/CRMContext';
import { cn } from '@/lib/utils';

interface CalendarEventCardProps {
  budget: Budget;
  compact?: boolean;
  onClick?: () => void;
}

function getStatusStyle(status: string) {
  if (status === 'aprovada') return 'bg-success/15 border-success/30 text-success';
  if (status === 'nao_aprovada') return 'bg-destructive/15 border-destructive/30 text-destructive';
  // "Em negociação" = all other active statuses
  return 'bg-warning/15 border-warning/30 text-warning';
}

function getDotColor(status: string) {
  if (status === 'aprovada') return 'bg-success';
  if (status === 'nao_aprovada') return 'bg-destructive';
  return 'bg-warning';
}

export function CalendarEventCard({ budget, compact = false, onClick }: CalendarEventCardProps) {
  const { clients } = useCRM();
  const client = clients.find(c => c.id === budget.clientId);
  const statusStyle = getStatusStyle(budget.status);
  const dotColor = getDotColor(budget.status);

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
          {budget.proposalId} - {budget.projectName}
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
          {budget.proposalId} - {budget.projectName}
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
