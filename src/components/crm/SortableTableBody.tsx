import { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TableBody, TableRow } from '@/components/ui/table';

interface Item {
  id: string;
}

interface Props<T extends Item> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderRow: (item: T, dragHandle: ReactNode) => ReactNode;
  /** Optional rows to render after sortable items (e.g. totals row). Not draggable. */
  footer?: ReactNode;
}

export function SortableTableBody<T extends Item>({
  items,
  onReorder,
  renderRow,
  footer,
}: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(items, oldIdx, newIdx));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <TableBody>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderRow(item, handle)}
            </SortableRow>
          ))}
          {footer}
        </TableBody>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, resizeObserverConfig: { disabled: true } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
      title="Arraste para reordenar"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  return (
    <TableRow ref={setNodeRef} style={style}>
      {children(handle)}
    </TableRow>
  );
}
