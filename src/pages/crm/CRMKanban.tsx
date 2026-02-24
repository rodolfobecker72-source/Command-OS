import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Header } from '@/components/layout/Header';
import { KanbanColumn } from '@/components/crm/KanbanColumn';
import { KanbanCard } from '@/components/crm/KanbanCard';
import { KanbanColumnManager } from '@/components/crm/KanbanColumnManager';
import { useCRM } from '@/contexts/CRMContext';
import { CRMCard, CRMStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CRMKanban() {
  const { getCRMCards, moveCard, kanbanColumns, approveBudget } = useCRM();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<CRMCard | null>(null);

  const cards = getCRMCards();

  // Sort columns by order
  const sortedColumns = useMemo(() => {
    return [...kanbanColumns].sort((a, b) => a.order - b.order);
  }, [kanbanColumns]);

  // Get column keys for drag detection
  const columnKeys = useMemo(() => {
    return kanbanColumns.map(c => c.key);
  }, [kanbanColumns]);

  const cardsByStatus = useMemo(() => {
    const grouped: Record<string, CRMCard[]> = {};
    
    // Initialize all columns
    kanbanColumns.forEach(col => {
      grouped[col.key] = [];
    });

    // Group cards
    cards.forEach((card) => {
      if (grouped[card.status]) {
        grouped[card.status].push(card);
      } else {
        // If status doesn't exist, put in first column
        const firstKey = sortedColumns[0]?.key;
        if (firstKey && grouped[firstKey]) {
          grouped[firstKey].push(card);
        }
      }
    });

    return grouped;
  }, [cards, kanbanColumns, sortedColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetStatus: string | null = null;

    // Check if dropped on a column
    if (columnKeys.includes(overId)) {
      targetStatus = overId;
    } else {
      // Dropped on another card - find the column of that card
      const overCard = cards.find((c) => c.id === overId);
      if (overCard) {
        targetStatus = overCard.status;
      }
    }

    if (!targetStatus) return;

    // If dropping on "aprovada", auto-approve and navigate to execution
    if (targetStatus === 'aprovada') {
      const card = cards.find(c => c.id === activeId);
      if (card && card.status !== 'aprovada') {
        const budget = getCRMCards().find(c => c.id === activeId);
        if (budget && budget.currentVersion > 0) {
          approveBudget(activeId, budget.currentVersion);
          navigate(`/crm/orcamento/${activeId}`);
          return;
        }
      }
    }

    moveCard(activeId, targetStatus as CRMStatus);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="CRM"
        subtitle="Gerencie suas oportunidades e propostas"
      />

      <div className="p-6">
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {cards.length} projeto(s) no pipeline
            </p>
            <KanbanColumnManager />
          </div>
          <Button
            onClick={() => navigate('/crm/orcamento/novo')}
            className="btn-hero"
          >
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {sortedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                status={column.key}
                cards={cardsByStatus[column.key] || []}
                color=""
                label={column.label}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="transform rotate-3 opacity-90">
                <KanbanCard card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
