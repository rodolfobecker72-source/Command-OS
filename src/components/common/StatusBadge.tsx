import { useCRM } from '@/contexts/CRMContext';
import { CRMStatus } from '@/types/crm';

interface StatusBadgeProps {
  status: CRMStatus;
  size?: 'sm' | 'md';
}

const defaultColorClasses: Record<string, string> = {
  oportunidade_mapeada: 'bg-info/10 text-info border border-info/20',
  fazer_proposta: 'bg-purple-100 text-purple-700 border border-purple-200',
  pronta_enviar: 'bg-warning/10 text-warning border border-warning/20',
  proposta_enviada: 'bg-accent/10 text-accent border border-accent/20',
  fazer_followup: 'bg-orange-100 text-orange-700 border border-orange-200',
  nao_aprovada: 'bg-destructive/10 text-destructive border border-destructive/20',
  aprovada: 'bg-success/10 text-success border border-success/20',
};

const fallbackColor = 'bg-muted text-muted-foreground border border-muted';

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { getStatusLabel } = useCRM();
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const colorClass = defaultColorClasses[status] || fallbackColor;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${colorClass}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
