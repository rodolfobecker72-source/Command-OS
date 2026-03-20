import { Budget, formatCurrency } from '@/types/crm';
import { useCRM } from '@/contexts/CRMContext';

interface CalendarEventCardProps {
  budget: Budget;
  compact?: boolean;
  onClick?: () => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  oportunidade_mapeada: 'bg-info',
  fazer_proposta: 'bg-purple-500',
  pronta_enviar: 'bg-warning',
  proposta_enviada: 'bg-accent',
  fazer_followup: 'bg-orange-500',
  nao_aprovada: 'bg-destructive',
  aprovada: 'bg-success',
};

export function CalendarEventCard({ budget, compact = false, onClick }: CalendarEventCardProps) {
  const { clients, getStatusLabel } = useCRM();
  const client = clients.find(c => c.id === budget.clientId);
  const dotColor = STATUS_DOT_COLORS[budget.status] || 'bg-muted-foreground';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity active:scale-[0.97] bg-card border border-border shadow-sm"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="truncate">{budget.proposalId}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1.5 rounded-md bg-card border border-border shadow-sm hover:shadow-md transition-shadow active:scale-[0.97] space-y-0.5"
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-xs font-semibold truncate text-foreground">
          {budget.proposalId}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate pl-3.5">
        {budget.projectName}
      </p>
      {client && (
        <p className="text-[10px] text-muted-foreground/70 truncate pl-3.5">
          {client.companyName}
        </p>
      )}
    </button>
  );
}
