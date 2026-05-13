import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ActivityStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

interface Activity {
  id: string;
  title: string;
  status: ActivityStatus;
  order: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectCardId: string;
  projectName: string;
}

const COLUMNS: { key: ActivityStatus; label: string; dotClass: string; chipClass: string }[] = [
  { key: 'nao_iniciado', label: 'Não iniciado', dotClass: 'bg-muted-foreground', chipClass: 'bg-muted text-muted-foreground' },
  { key: 'em_andamento', label: 'Em andamento', dotClass: 'bg-info', chipClass: 'bg-info/10 text-info' },
  { key: 'concluido', label: 'Concluído', dotClass: 'bg-success', chipClass: 'bg-success/10 text-success' },
];

export function ProjectActivitiesDialog({ open, onOpenChange, projectCardId, projectName }: Props) {
  const { workspace } = useAuth();
  const workspaceId = workspace?.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitleByCol, setNewTitleByCol] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [driveLinkSaved, setDriveLinkSaved] = useState('');
  const [savingDrive, setSavingDrive] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!open || !projectCardId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('project_activities')
      .select('*')
      .eq('project_card_id', projectCardId)
      .order('order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error('Erro ao carregar atividades');
        } else {
          setActivities((data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            status: d.status as ActivityStatus,
            order: d.order,
          })));
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, projectCardId]);

  const grouped = useMemo(() => {
    const map: Record<ActivityStatus, Activity[]> = { nao_iniciado: [], em_andamento: [], concluido: [] };
    for (const a of [...activities].sort((a, b) => a.order - b.order)) {
      map[a.status].push(a);
    }
    return map;
  }, [activities]);

  const activeActivity = activities.find(a => a.id === activeId);

  const handleAdd = async (status: ActivityStatus) => {
    const title = (newTitleByCol[status] || '').trim();
    if (!title || !workspaceId) return;
    const order = (grouped[status].at(-1)?.order ?? -1) + 1;
    const { data, error } = await supabase
      .from('project_activities')
      .insert({ workspace_id: workspaceId, project_card_id: projectCardId, title, status, order })
      .select()
      .single();
    if (error || !data) {
      toast.error('Erro ao criar atividade');
      return;
    }
    setActivities(prev => [...prev, { id: data.id, title: data.title, status: data.status as ActivityStatus, order: data.order }]);
    setNewTitleByCol(prev => ({ ...prev, [status]: '' }));
  };

  const handleDelete = async (id: string) => {
    const prev = activities;
    setActivities(p => p.filter(a => a.id !== id));
    const { error } = await supabase.from('project_activities').delete().eq('id', id);
    if (error) {
      setActivities(prev);
      toast.error('Erro ao remover atividade');
    }
  };

  const handleSaveEdit = async (id: string) => {
    const title = editTitle.trim();
    setEditingId(null);
    if (!title) return;
    const original = activities.find(a => a.id === id);
    if (!original || original.title === title) return;
    setActivities(prev => prev.map(a => a.id === id ? { ...a, title } : a));
    const { error } = await supabase.from('project_activities').update({ title }).eq('id', id);
    if (error) toast.error('Erro ao atualizar atividade');
  };

  const persistOrder = async (next: Activity[]) => {
    const updates = next.map((a, idx) => ({ id: a.id, status: a.status, order: idx }));
    setActivities(next.map((a, idx) => ({ ...a, order: idx })));
    // fire-and-forget per-row updates (small list)
    await Promise.all(
      updates.map(u =>
        supabase.from('project_activities').update({ status: u.status, order: u.order }).eq('id', u.id)
      )
    );
  };

  const findColumnOf = (id: string): ActivityStatus | null => {
    const a = activities.find(x => x.id === id);
    if (a) return a.status;
    if (id === 'nao_iniciado' || id === 'em_andamento' || id === 'concluido') return id;
    return null;
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const fromCol = findColumnOf(activeIdStr);
    const toCol = findColumnOf(overIdStr);
    if (!fromCol || !toCol) return;

    // Build new global ordered list (by column, in column order)
    const rebuild = (mutator: (g: Record<ActivityStatus, Activity[]>) => void) => {
      const g: Record<ActivityStatus, Activity[]> = {
        nao_iniciado: [...grouped.nao_iniciado],
        em_andamento: [...grouped.em_andamento],
        concluido: [...grouped.concluido],
      };
      mutator(g);
      const flat: Activity[] = [];
      for (const col of COLUMNS) flat.push(...g[col.key].map(a => ({ ...a, status: col.key })));
      return flat;
    };

    if (fromCol === toCol) {
      const list = grouped[fromCol];
      const oldIdx = list.findIndex(a => a.id === activeIdStr);
      const newIdx = overIdStr === fromCol
        ? list.length - 1
        : list.findIndex(a => a.id === overIdStr);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      const next = rebuild(g => { g[fromCol] = arrayMove(list, oldIdx, newIdx); });
      persistOrder(next);
    } else {
      const next = rebuild(g => {
        g[fromCol] = g[fromCol].filter(a => a.id !== activeIdStr);
        const moved = activities.find(a => a.id === activeIdStr);
        if (!moved) return;
        const insertAt = overIdStr === toCol
          ? g[toCol].length
          : g[toCol].findIndex(a => a.id === overIdStr);
        const movedUpdated = { ...moved, status: toCol };
        if (insertAt < 0) g[toCol].push(movedUpdated);
        else g[toCol].splice(insertAt, 0, movedUpdated);
      });
      persistOrder(next);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Atividades do projeto</DialogTitle>
          <DialogDescription className="truncate">{projectName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {COLUMNS.map(col => (
                <Column
                  key={col.key}
                  col={col}
                  activities={grouped[col.key]}
                  newTitle={newTitleByCol[col.key] || ''}
                  onNewTitle={(v) => setNewTitleByCol(prev => ({ ...prev, [col.key]: v }))}
                  onAdd={() => handleAdd(col.key)}
                  onDelete={handleDelete}
                  editingId={editingId}
                  editTitle={editTitle}
                  onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                  onChangeEdit={setEditTitle}
                  onSaveEdit={handleSaveEdit}
                />
              ))}
            </div>
            <DragOverlay>
              {activeActivity && <ActivityCard activity={activeActivity} dragging />}
            </DragOverlay>
          </DndContext>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Column({
  col,
  activities,
  newTitle,
  onNewTitle,
  onAdd,
  onDelete,
  editingId,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
}: {
  col: { key: ActivityStatus; label: string; dotClass: string; chipClass: string };
  activities: Activity[];
  newTitle: string;
  onNewTitle: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editTitle: string;
  onStartEdit: (id: string, title: string) => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border bg-muted/30 p-3 flex flex-col gap-2 min-h-[260px] transition-colors',
        isOver && 'bg-muted/60 border-primary/40'
      )}
    >
      <div className={cn('inline-flex items-center gap-2 self-start px-2.5 py-0.5 rounded-full text-xs font-medium', col.chipClass)}>
        <span className={cn('w-2 h-2 rounded-full', col.dotClass)} />
        {col.label}
        <span className="opacity-60">({activities.length})</span>
      </div>

      <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {activities.map(a => (
            <SortableCard
              key={a.id}
              activity={a}
              isEditing={editingId === a.id}
              editTitle={editTitle}
              onChangeEdit={onChangeEdit}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <div className="flex items-center gap-2 pt-1">
        <Input
          value={newTitle}
          onChange={e => onNewTitle(e.target.value)}
          placeholder="+ Nova tarefa"
          className="h-8 bg-background"
          onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onAdd} disabled={!newTitle.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableCard({
  activity,
  isEditing,
  editTitle,
  onChangeEdit,
  onStartEdit,
  onSaveEdit,
  onDelete,
}: {
  activity: Activity;
  isEditing: boolean;
  editTitle: string;
  onChangeEdit: (v: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
    resizeObserverConfig: { disabled: true },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-md border bg-card px-3 py-2 text-sm flex items-center gap-2 hover:border-primary/40"
    >
      <div className="flex-1 min-w-0" {...(!isEditing ? { ...attributes, ...listeners } : {})}>
        {isEditing ? (
          <Input
            autoFocus
            value={editTitle}
            onChange={e => onChangeEdit(e.target.value)}
            onBlur={() => onSaveEdit(activity.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSaveEdit(activity.id);
              if (e.key === 'Escape') onSaveEdit(activity.id);
            }}
            className="h-7"
          />
        ) : (
          <button
            type="button"
            onClick={() => onStartEdit(activity.id, activity.title)}
            className={cn(
              'text-left w-full truncate cursor-text',
              activity.status === 'concluido' && 'line-through text-muted-foreground'
            )}
            title={activity.title}
          >
            {activity.title}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(activity.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ActivityCard({ activity, dragging }: { activity: Activity; dragging?: boolean }) {
  return (
    <div className={cn('rounded-md border bg-card px-3 py-2 text-sm shadow-lg', dragging && 'rotate-2')}>
      {activity.title}
    </div>
  );
}
