import { getScoreClass } from '@/types/crm';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={`score-badge ${getScoreClass(score)} ${sizeClasses[size]} font-bold`}
      title={`Score: ${score}`}
    >
      {score}
    </div>
  );
}
