import { POTENTIAL_BADGE_LABELS, POTENTIAL_BADGE_COLORS } from '@/utils/clientScore';

interface PotentialBadgeProps {
  badge: 'alto_potencial' | 'neutro' | 'alto_custo_comercial';
  size?: 'sm' | 'md';
}

export function PotentialBadge({ badge, size = 'md' }: PotentialBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const colorClass = POTENTIAL_BADGE_COLORS[badge];
  const label = POTENTIAL_BADGE_LABELS[badge];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses[size]} ${colorClass}`}
    >
      {label}
    </span>
  );
}
