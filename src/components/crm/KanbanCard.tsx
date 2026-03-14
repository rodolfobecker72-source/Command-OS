import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CRMCard, formatCurrency } from '@/types/crm';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Film, Camera, Smartphone, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '@/contexts/CRMContext';

interface KanbanCardProps {
  card: CRMCard;
}

const serviceIcons: Record<string, typeof Film> = {
  CINE: Film,
  FOTO: Camera,
  MOBILE: Smartphone,
};

const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatExecutionMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_PT[idx] || month}/${year}`;
}

export function KanbanCard({ card }: KanbanCardProps) {
  const navigate = useNavigate();
  const { getCategoryLabel } = useCRM();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ServiceIcon = serviceIcons[card.serviceType];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`kanban-card group ${isDragging ? 'opacity-50 shadow-xl z-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{card.projectName}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {card.clientName}
              </p>
            </div>
            <ScoreBadge score={card.clientScore} size="sm" />
          </div>

          {/* Service Types - All Tags */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {card.serviceTypes.map((type) => {
              const Icon = serviceIcons[type] || Film;
              return (
                <span 
                  key={type} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium"
                >
                  <Icon className="w-3 h-3" />
                  {getCategoryLabel(type)}
                </span>
              );
            })}
            {card.currentVersion > 0 && (
              <span className="text-xs text-muted-foreground">
                V{card.currentVersion}
              </span>
            )}
          </div>

          {/* Value & Execution Month */}
          <div className="flex items-center justify-between flex-wrap gap-1">
            {card.value && (
              <span className="text-sm font-semibold text-accent">
                {formatCurrency(card.value)}
              </span>
            )}
            {card.executionMonth && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {formatExecutionMonth(card.executionMonth)}
              </Badge>
            )}
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigate(`/crm/orcamento/${card.budgetId}`)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              <FileText className="w-3 h-3" />
              Ver orçamento
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
