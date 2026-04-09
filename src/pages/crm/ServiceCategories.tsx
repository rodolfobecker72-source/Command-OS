import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { ServiceCategory, ServiceObjective } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  Pencil,
  Target,
  Layers,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

// ---- Sortable Objective Item ----
function SortableObjectiveItem({
  objective,
  editingObjective,
  setEditingObjective,
  handleUpdateObjective,
  setDeleteObjectiveId,
}: {
  objective: ServiceObjective;
  editingObjective: ServiceObjective | null;
  setEditingObjective: (o: ServiceObjective | null) => void;
  handleUpdateObjective: () => void;
  setDeleteObjectiveId: (id: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
    resizeObserverConfig: { disabled: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <Target className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1">
        {editingObjective?.id === objective.id ? (
          <div className="flex items-center gap-2">
            <Input
              value={editingObjective.label}
              onChange={(e) => setEditingObjective({ ...editingObjective, label: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateObjective();
                if (e.key === 'Escape') setEditingObjective(null);
              }}
              autoFocus
              className="h-8"
            />
            <Button size="sm" variant="ghost" onClick={handleUpdateObjective}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingObjective(null)}>Cancelar</Button>
          </div>
        ) : (
          <span className="text-sm font-medium">{objective.label}</span>
        )}
      </div>
      {editingObjective?.id !== objective.id && (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingObjective(objective)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteObjectiveId(objective.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- Sortable Category Card ----
function SortableCategoryCard({
  category,
  objectives,
  catIndex,
  editingCategory,
  setEditingCategory,
  handleUpdateCategory,
  setDeleteCategoryId,
  editingObjective,
  setEditingObjective,
  handleUpdateObjective,
  setDeleteObjectiveId,
  addingObjectiveTo,
  setAddingObjectiveTo,
  newObjectiveLabel,
  setNewObjectiveLabel,
  handleAddObjective,
  reorderServiceObjectives,
}: {
  category: ServiceCategory;
  objectives: ServiceObjective[];
  catIndex: number;
  editingCategory: ServiceCategory | null;
  setEditingCategory: (c: ServiceCategory | null) => void;
  handleUpdateCategory: () => void;
  setDeleteCategoryId: (id: string | null) => void;
  editingObjective: ServiceObjective | null;
  setEditingObjective: (o: ServiceObjective | null) => void;
  handleUpdateObjective: () => void;
  setDeleteObjectiveId: (id: string | null) => void;
  addingObjectiveTo: string | null;
  setAddingObjectiveTo: (key: string | null) => void;
  newObjectiveLabel: string;
  setNewObjectiveLabel: (v: string) => void;
  handleAddObjective: (categoryKey: string) => void;
  reorderServiceObjectives: (objectives: ServiceObjective[]) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    resizeObserverConfig: { disabled: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const objSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleObjDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = objectives.findIndex(o => o.id === active.id);
    const newIndex = objectives.findIndex(o => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(objectives, oldIndex, newIndex);
    reorderServiceObjectives(reordered);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: 0.05 * catIndex }}
    >
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground p-1">
                <GripVertical className="w-5 h-5" />
              </button>
              <div className="p-3 rounded-xl bg-foreground/5">
                <Layers className="w-6 h-6 text-foreground" />
              </div>
              <div>
                {editingCategory?.id === category.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingCategory.label}
                      onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateCategory();
                        if (e.key === 'Escape') setEditingCategory(null);
                      }}
                      autoFocus
                      className="h-8 w-48"
                    />
                    <Button size="sm" variant="ghost" onClick={handleUpdateCategory}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                  </div>
                ) : (
                  <CardTitle>{category.label}</CardTitle>
                )}
                <CardDescription>
                  {objectives.length} objetivo{objectives.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            {editingCategory?.id !== category.id && (
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditingCategory(category)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteCategoryId(category.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DndContext sensors={objSensors} collisionDetection={closestCenter} onDragEnd={handleObjDragEnd}>
            <SortableContext items={objectives.map(o => o.id)} strategy={verticalListSortingStrategy}>
              {objectives.map((objective) => (
                <SortableObjectiveItem
                  key={objective.id}
                  objective={objective}
                  editingObjective={editingObjective}
                  setEditingObjective={setEditingObjective}
                  handleUpdateObjective={handleUpdateObjective}
                  setDeleteObjectiveId={setDeleteObjectiveId}
                />
              ))}
            </SortableContext>
          </DndContext>

          {objectives.length === 0 && addingObjectiveTo !== category.key && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum objetivo cadastrado
            </div>
          )}

          {addingObjectiveTo === category.key ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border-2 border-dashed border-primary/20">
              <Target className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <Input
                  value={newObjectiveLabel}
                  onChange={(e) => setNewObjectiveLabel(e.target.value)}
                  placeholder="Nome do objetivo..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddObjective(category.key);
                    if (e.key === 'Escape') {
                      setAddingObjectiveTo(null);
                      setNewObjectiveLabel('');
                    }
                  }}
                  autoFocus
                  className="h-8"
                />
              </div>
              <Button size="sm" onClick={() => handleAddObjective(category.key)}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingObjectiveTo(null); setNewObjectiveLabel(''); }}>Cancelar</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => { setAddingObjectiveTo(category.key); setNewObjectiveLabel(''); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Objetivo
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- Main Page ----
export function ServiceCategories() {
  const {
    serviceCategories,
    serviceObjectives,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    reorderServiceCategories,
    addServiceObjective,
    updateServiceObjective,
    deleteServiceObjective,
    reorderServiceObjectives,
  } = useCRM();

  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const [addingObjectiveTo, setAddingObjectiveTo] = useState<string | null>(null);
  const [newObjectiveLabel, setNewObjectiveLabel] = useState('');
  const [editingObjective, setEditingObjective] = useState<ServiceObjective | null>(null);
  const [deleteObjectiveId, setDeleteObjectiveId] = useState<string | null>(null);

  const generateKey = (label: string): string =>
    label.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

  const generateObjectiveKey = (label: string): string =>
    label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) { toast.error('Digite um nome para a categoria'); return; }
    const key = generateKey(newCategoryLabel);
    if (serviceCategories.some(c => c.key === key)) { toast.error('Já existe uma categoria com este nome'); return; }
    addServiceCategory({ key, label: newCategoryLabel.trim() });
    setNewCategoryLabel('');
    setIsAddingCategory(false);
    toast.success('Categoria adicionada!');
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.label.trim()) { toast.error('O nome da categoria não pode estar vazio'); return; }
    updateServiceCategory(editingCategory.id, { label: editingCategory.label.trim() });
    setEditingCategory(null);
    toast.success('Categoria atualizada!');
  };

  const handleDeleteCategory = () => {
    if (!deleteCategoryId) return;
    deleteServiceCategory(deleteCategoryId);
    setDeleteCategoryId(null);
    toast.success('Categoria removida!');
  };

  const handleAddObjective = (categoryKey: string) => {
    if (!newObjectiveLabel.trim()) { toast.error('Digite um nome para o objetivo'); return; }
    const key = generateObjectiveKey(newObjectiveLabel);
    addServiceObjective({ categoryKey, key, label: newObjectiveLabel.trim() });
    setNewObjectiveLabel('');
    setAddingObjectiveTo(null);
    toast.success('Objetivo adicionado!');
  };

  const handleUpdateObjective = () => {
    if (!editingObjective || !editingObjective.label.trim()) { toast.error('O nome do objetivo não pode estar vazio'); return; }
    updateServiceObjective(editingObjective.id, { label: editingObjective.label.trim() });
    setEditingObjective(null);
    toast.success('Objetivo atualizado!');
  };

  const handleDeleteObjective = () => {
    if (!deleteObjectiveId) return;
    deleteServiceObjective(deleteObjectiveId);
    setDeleteObjectiveId(null);
    toast.success('Objetivo removido!');
  };

  const sortedCategories = [...serviceCategories].sort((a, b) => a.order - b.order);

  const getObjectivesFor = (categoryKey: string) =>
    serviceObjectives.filter(o => o.categoryKey === categoryKey).sort((a, b) => a.order - b.order);

  // DnD for categories
  const catSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedCategories.findIndex(c => c.id === active.id);
    const newIndex = sortedCategories.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex);
    reorderServiceCategories(reordered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Categorias de Serviço" subtitle="Gerencie as categorias e objetivos dos serviços" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <DndContext sensors={catSensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
          <SortableContext items={sortedCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {sortedCategories.map((category, catIndex) => (
                <SortableCategoryCard
                  key={category.id}
                  category={category}
                  objectives={getObjectivesFor(category.key)}
                  catIndex={catIndex}
                  editingCategory={editingCategory}
                  setEditingCategory={setEditingCategory}
                  handleUpdateCategory={handleUpdateCategory}
                  setDeleteCategoryId={setDeleteCategoryId}
                  editingObjective={editingObjective}
                  setEditingObjective={setEditingObjective}
                  handleUpdateObjective={handleUpdateObjective}
                  setDeleteObjectiveId={setDeleteObjectiveId}
                  addingObjectiveTo={addingObjectiveTo}
                  setAddingObjectiveTo={setAddingObjectiveTo}
                  newObjectiveLabel={newObjectiveLabel}
                  setNewObjectiveLabel={setNewObjectiveLabel}
                  handleAddObjective={handleAddObjective}
                  reorderServiceObjectives={reorderServiceObjectives}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {isAddingCategory ? (
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="Nome da nova categoria..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryLabel(''); }
                    }}
                    autoFocus
                  />
                </div>
                <Button onClick={handleAddCategory}>Adicionar</Button>
                <Button variant="ghost" onClick={() => { setIsAddingCategory(false); setNewCategoryLabel(''); }}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full border-dashed h-14" onClick={() => setIsAddingCategory(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Nova Categoria
          </Button>
        )}
      </div>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Todos os objetivos associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteObjectiveId} onOpenChange={() => setDeleteObjectiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Objetivo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este objetivo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteObjective}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
