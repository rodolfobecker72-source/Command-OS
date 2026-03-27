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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatExecutionMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_PT[idx] || month}/${year}`;
}

export function CRMKanban() {
  const { getCRMCards, moveCard, kanbanColumns, approveBudget } = useCRM();
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<CRMCard | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'execution'>('all');

  // Approval via drag states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [pendingApprovalVersion, setPendingApprovalVersion] = useState<number>(0);
  const [dragApproveMonth, setDragApproveMonth] = useState('');

  const cards = getCRMCards();

  // Get unique months for filter based on mode
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    cards.forEach(c => {
      if (filterMode === 'execution') {
        if (c.executionMonth) months.add(c.executionMonth);
      } else {
        const d = new Date(c.createdAt);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.add(ym);
      }
    });
    return [...months].sort();
  }, [cards, filterMode]);

  // Filter cards by month
  const filteredCards = useMemo(() => {
    if (monthFilter === 'all') return cards;
    if (filterMode === 'execution') {
      return cards.filter(c => c.executionMonth === monthFilter);
    }
    return cards.filter(c => {
      const d = new Date(c.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === monthFilter;
    });
  }, [cards, monthFilter, filterMode]);

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
    filteredCards.forEach((card) => {
      if (grouped[card.status]) {
        grouped[card.status].push(card);
      } else {
        const firstKey = sortedColumns[0]?.key;
        if (firstKey && grouped[firstKey]) {
          grouped[firstKey].push(card);
        }
      }
    });

    // Sort cards within each column by proposal number (ascending)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const numA = parseInt(a.projectName, 10);
        const numB = parseInt(b.projectName, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.projectName.localeCompare(b.projectName);
      });
    });

    return grouped;
  }, [filteredCards, kanbanColumns, sortedColumns]);

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

    // If dropping on "aprovada", show dialog to collect execution month
    if (targetStatus === 'aprovada') {
      const card = cards.find(c => c.id === activeId);
      if (card && card.status !== 'aprovada' && card.currentVersion > 0) {
        setPendingApprovalId(activeId);
        setPendingApprovalVersion(card.currentVersion);
        setDragApproveMonth('');
        setApproveDialogOpen(true);
        return;
      }
    }

    moveCard(activeId, targetStatus as CRMStatus);
  };

  const handleConfirmDragApprove = async () => {
    if (pendingApprovalId) {
      await approveBudget(pendingApprovalId, pendingApprovalVersion, dragApproveMonth || undefined);
      navigate(`/crm/orcamento/${pendingApprovalId}`);
    }
    setApproveDialogOpen(false);
    setPendingApprovalId(null);
    setDragApproveMonth('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="CRM"
        subtitle="Gerencie suas oportunidades e propostas"
      />

      <div className="p-4 md:p-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <p className="text-sm text-muted-foreground">
              {filteredCards.length} projeto(s)
            </p>
            <KanbanColumnManager />
            {availableMonths.length > 0 && (
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40 md:w-48 h-9">
                  <SelectValue placeholder="Filtrar por mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m}>{formatExecutionMonth(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            onClick={() => navigate('/crm/orcamento/novo')}
            className="btn-hero w-full sm:w-auto"
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

        {/* Approval Dialog for Drag */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Orçamento</DialogTitle>
              <DialogDescription>
                Confirme a aprovação e informe o mês previsto de execução.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="drag-execution-month">Mês de Execução</Label>
              <Input
                id="drag-execution-month"
                type="month"
                value={dragApproveMonth}
                onChange={(e) => setDragApproveMonth(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mês previsto para execução do projeto (opcional)
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-success hover:bg-success/90" onClick={handleConfirmDragApprove}>
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
