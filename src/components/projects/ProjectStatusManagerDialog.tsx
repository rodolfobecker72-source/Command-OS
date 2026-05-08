import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRM } from '@/contexts/CRMContext';
import { ProjectColumn } from '@/types/crm';
import { toast } from 'sonner';

const COLOR_OPTIONS = [
  { value: 'bg-info', label: 'Azul' },
  { value: 'bg-warning', label: 'Laranja' },
  { value: 'bg-success', label: 'Verde' },
  { value: 'bg-destructive', label: 'Vermelho' },
  { value: 'bg-accent', label: 'Acento' },
  { value: 'bg-muted-foreground', label: 'Cinza' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SortableRow({
  column,
  onChange,
  onDelete,
  canDelete,
}: {
  column: ProjectColumn;
  onChange: (updates: Partial<ProjectColumn>) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    resizeObserverConfig: { disabled: true },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border bg-card ${isDragging ? 'opacity-50' : ''}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${column.color}`} />
      <Input
        value={column.label}
        onChange={(e) => onChange({ label: e.target.value })}
        className="h-8 flex-1"
      />
      <Select value={column.color} onValueChange={(v) => onChange({ color: v })}>
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={{ zIndex: 200 }}>
          {COLOR_OPTIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${c.value}`} />
                {c.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        disabled={!canDelete}
        onClick={onDelete}
        title={!canDelete ? 'Status padrão não pode ser removido' : 'Remover'}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function ProjectStatusManagerDialog({ open, onOpenChange }: Props) {
  const { projectColumns, projectCards, addProjectColumn, updateProjectColumn, deleteProjectColumn, reorderProjectColumns } = useCRM();
  const [local, setLocal] = useState<ProjectColumn[]>([]);
  const [newName, setNewName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (open) {
      setLocal([...projectColumns].sort((a, b) => a.order - b.order));
    }
  }, [open, projectColumns]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setLocal((items) => {
      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const handleSave = async () => {
    // Update labels/colors that changed
    for (const col of local) {
      const original = projectColumns.find((c) => c.id === col.id);
      if (!original) continue;
      if (original.label !== col.label || original.color !== col.color) {
        await updateProjectColumn(col.id, { label: col.label, color: col.color });
      }
    }
    // Persist new order
    await reorderProjectColumns(local.map((c) => c.id));
    toast.success('Status atualizados');
    onOpenChange(false);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const key = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    await addProjectColumn({ key: key || `status_${Date.now()}`, label: name, color: 'bg-info' });
    setNewName('');
  };

  const handleDelete = async (col: ProjectColumn) => {
    const cards = projectCards.filter((c) => c.status === col.key);
    if (cards.length > 0) {
      toast.error(`Não é possível remover: ${cards.length} projeto(s) neste status`);
      return;
    }
    if (col.isDefault) {
      toast.error('Status padrão não pode ser removido');
      return;
    }
    await deleteProjectColumn(col.id);
    setLocal((prev) => prev.filter((c) => c.id !== col.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar status dos projetos</DialogTitle>
          <DialogDescription>
            Arraste para reordenar, edite o nome ou a cor, ou adicione novos status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={local.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {local.map((col) => (
                <SortableRow
                  key={col.id}
                  column={col}
                  onChange={(u) => setLocal((prev) => prev.map((c) => (c.id === col.id ? { ...c, ...u } : c)))}
                  onDelete={() => handleDelete(col)}
                  canDelete={!col.isDefault}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Input
            placeholder="Nome do novo status"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
