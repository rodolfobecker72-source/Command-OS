import { CLASSIFICATION_LABELS } from '@/utils/clientScore';

interface ClassificationBadgeProps {
  classification: 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md';
}

const classificationColors: Record<string, string> = {
  A: 'bg-success/10 text-success border-success/20',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-warning/10 text-warning border-warning/20',
  D: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function ClassificationBadge({ classification, size = 'md' }: ClassificationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses[size]} ${classificationColors[classification]}`}
    >
      {CLASSIFICATION_LABELS[classification]}
    </span>
  );
}
