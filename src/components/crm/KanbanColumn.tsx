import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CRMCard, CRMStatus } from '@/types/crm';
import { KanbanCard } from './KanbanCard';
import { motion } from 'framer-motion';

interface KanbanColumnProps {
  status: CRMStatus;
  cards: CRMCard[];
  color: string;
  label?: string;
  hideValue?: boolean;
}

const defaultColumnColors: Record<string, { bg: string; border: string; dot: string }> = {
  oportunidade_mapeada: { bg: 'bg-info/5', border: 'border-info/30', dot: 'bg-info' },
  fazer_proposta: { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  pronta_enviar: { bg: 'bg-warning/5', border: 'border-warning/30', dot: 'bg-warning' },
  proposta_enviada: { bg: 'bg-accent/5', border: 'border-accent/30', dot: 'bg-accent' },
  fazer_followup: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  nao_aprovada: { bg: 'bg-destructive/5', border: 'border-destructive/30', dot: 'bg-destructive' },
  aprovada: { bg: 'bg-success/5', border: 'border-success/30', dot: 'bg-success' },
};

const fallbackColors = { bg: 'bg-muted/50', border: 'border-border', dot: 'bg-muted-foreground' };

export function KanbanColumn({ status, cards, label }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const colors = defaultColumnColors[status] || fallbackColors;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[300px] w-[300px] rounded-xl ${colors.bg} border ${colors.border} ${
        isOver ? 'ring-2 ring-accent ring-offset-2' : ''
      } transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <h3 className="font-semibold text-sm">{label || status}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-250px)]">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <KanbanCard card={card} />
            </motion.div>
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum projeto nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
