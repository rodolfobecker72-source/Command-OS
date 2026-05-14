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
import { Plus, Trash2, Loader2, ExternalLink, Copy, User, Calendar, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  assignedToUserIds: string[];
  dueDate: string | null;
}

const MAX_ASSIGNEES = 2;

interface MemberOption {
  id: string;
  name: string;
  photoUrl: string | null;
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

const UNASSIGNED = '__unassigned__';

function formatDateBR(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

export function ProjectActivitiesDialog({ open, onOpenChange, projectCardId, projectName }: Props) {
  const { workspace, profile } = useAuth();
  const workspaceId = workspace?.id;
  const [comments, setComments] = useState<Array<{ id: string; userId: string; userName: string; photoUrl: string | null; text: string; createdAt: string }>>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitleByCol, setNewTitleByCol] = useState<Record<string, string>>({});
  const [newAssigneeByCol, setNewAssigneeByCol] = useState<Record<string, string>>({});
  const [newDueByCol, setNewDueByCol] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [driveLinkSaved, setDriveLinkSaved] = useState('');
  const [savingDrive, setSavingDrive] = useState(false);
  const [briefing, setBriefing] = useState<{
    objective: string;
    projectDescription: string;
    description: string;
    services: Array<{ serviceType: string; objective: string; description: string; items: Array<{ description: string; quantity: number }> }>;
  } | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!open || !projectCardId) return;
    let cancelled = false;
    setLoading(true);

    // Load drive link + briefing from commercial budget
    (async () => {
      const { data: card } = await supabase
        .from('project_cards')
        .select('material_link, budget_id, comments')
        .eq('id', projectCardId)
        .maybeSingle();
      const link = (card as any)?.material_link || '';
      const cardComments = Array.isArray((card as any)?.comments) ? (card as any).comments : [];
      if (!cancelled) {
        setDriveLink(link);
        setDriveLinkSaved(link);
        setComments(cardComments);
      }
      const budgetId = (card as any)?.budget_id;
      if (!budgetId) {
        if (!cancelled) setBriefing(null);
        return;
      }
      const { data: budget } = await supabase
        .from('budgets')
        .select('objective, project_description, description, approved_version, current_version')
        .eq('id', budgetId)
        .maybeSingle();
      if (!budget) {
        if (!cancelled) setBriefing(null);
        return;
      }
      const versionNumber = (budget as any).approved_version ?? (budget as any).current_version;
      let services: any[] = [];
      if (versionNumber != null) {
        const { data: ver } = await supabase
          .from('budget_versions')
          .select('services')
          .eq('budget_id', budgetId)
          .eq('version', versionNumber)
          .maybeSingle();
        services = ((ver as any)?.services || []) as any[];
      }
      const mappedServices = services.map((s: any) => ({
        serviceType: s.serviceType || '',
        objective: s.objective || '',
        description: s.description || '',
        items: (s.costs || []).map((c: any) => ({
          description: c.description || '',
          quantity: Number(c.quantity) || 0,
        })).filter((c: any) => c.description),
      }));
      if (!cancelled) {
        setBriefing({
          objective: (budget as any).objective || '',
          projectDescription: (budget as any).project_description || '',
          description: (budget as any).description || '',
          services: mappedServices,
        });
      }
    })();

    // Load workspace members (excluding vendedor)
    if (workspaceId) {
      (async () => {
        const { data: memberData } = await supabase
          .from('workspace_members')
          .select('user_id, role')
          .eq('workspace_id', workspaceId)
          .neq('role', 'vendedor');
        if (!memberData || memberData.length === 0) {
          setMembers([]);
          return;
        }
        const ids = memberData.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, photo_url')
          .in('id', ids);
        const list: MemberOption[] = (profiles || [])
          .map((p: any) => ({ id: p.id, name: p.name || '', photoUrl: p.photo_url || null }))
          .filter((p) => p.name)
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        if (!cancelled) setMembers(list);
      })();
    }

    // Load activities
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
            assignedToUserIds: Array.isArray(d.assigned_to_user_ids) && d.assigned_to_user_ids.length > 0
              ? d.assigned_to_user_ids
              : (d.assigned_to_user_id ? [d.assigned_to_user_id] : []),
            dueDate: d.due_date ?? null,
          })));
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, projectCardId, workspaceId]);

  const handleSaveDrive = async () => {
    if (driveLink === driveLinkSaved) return;
    setSavingDrive(true);
    const { error } = await supabase
      .from('project_cards')
      .update({ material_link: driveLink })
      .eq('id', projectCardId);
    setSavingDrive(false);
    if (error) {
      toast.error('Erro ao salvar link');
      return;
    }
    setDriveLinkSaved(driveLink);
    toast.success('Link salvo');
  };

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
    const assignee = newAssigneeByCol[status] && newAssigneeByCol[status] !== UNASSIGNED
      ? newAssigneeByCol[status]
      : null;
    const ids = assignee ? [assignee] : [];
    const due = newDueByCol[status] || null;
    const { data, error } = await supabase
      .from('project_activities')
      .insert({
        workspace_id: workspaceId,
        project_card_id: projectCardId,
        title,
        status,
        order,
        assigned_to_user_id: assignee,
        assigned_to_user_ids: ids,
        due_date: due,
      } as any)
      .select()
      .single();
    if (error || !data) {
      toast.error('Erro ao criar atividade');
      return;
    }
    setActivities(prev => [...prev, {
      id: data.id,
      title: data.title,
      status: data.status as ActivityStatus,
      order: data.order,
      assignedToUserIds: Array.isArray((data as any).assigned_to_user_ids) && (data as any).assigned_to_user_ids.length > 0
        ? (data as any).assigned_to_user_ids
        : ((data as any).assigned_to_user_id ? [(data as any).assigned_to_user_id] : []),
      dueDate: (data as any).due_date ?? null,
    }]);
    setNewTitleByCol(prev => ({ ...prev, [status]: '' }));
    setNewAssigneeByCol(prev => ({ ...prev, [status]: '' }));
    setNewDueByCol(prev => ({ ...prev, [status]: '' }));
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

  const handleToggleAssignee = async (id: string, userId: string | null) => {
    const current = activities.find(a => a.id === id);
    if (!current) return;
    let nextIds: string[];
    if (userId === null) {
      nextIds = [];
    } else if (current.assignedToUserIds.includes(userId)) {
      nextIds = current.assignedToUserIds.filter(u => u !== userId);
    } else {
      if (current.assignedToUserIds.length >= MAX_ASSIGNEES) {
        toast.error(`Máximo de ${MAX_ASSIGNEES} responsáveis por tarefa`);
        return;
      }
      nextIds = [...current.assignedToUserIds, userId];
    }
    setActivities(prev => prev.map(a => a.id === id ? { ...a, assignedToUserIds: nextIds } : a));
    const { error } = await supabase
      .from('project_activities')
      .update({
        assigned_to_user_ids: nextIds,
        assigned_to_user_id: nextIds[0] ?? null,
      } as any)
      .eq('id', id);
    if (error) toast.error('Erro ao atualizar responsáveis');
  };

  const handleUpdateDue = async (id: string, due: string | null) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, dueDate: due } : a));
    const { error } = await supabase
      .from('project_activities')
      .update({ due_date: due } as any)
      .eq('id', id);
    if (error) toast.error('Erro ao atualizar prazo');
  };

  const persistOrder = async (next: Activity[]) => {
    const updates = next.map((a, idx) => ({ id: a.id, status: a.status, order: idx }));
    setActivities(next.map((a, idx) => ({ ...a, order: idx })));
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atividades do projeto</DialogTitle>
          <DialogDescription className="truncate">{projectName}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            value={driveLink}
            onChange={e => setDriveLink(e.target.value)}
            onBlur={handleSaveDrive}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder="Link do Google Drive do projeto"
            className="h-9 flex-1"
          />
          {driveLinkSaved && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                title="Copiar link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(driveLinkSaved);
                    toast.success('Link copiado');
                  } catch {
                    toast.error('Não foi possível copiar');
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => window.open(driveLinkSaved, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
              </Button>
            </>
          )}
          {savingDrive && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {briefing && (briefing.objective || briefing.projectDescription || briefing.description || briefing.services.length > 0) && (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setBriefingOpen(o => !o)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              {briefingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Briefing e entregas do projeto</span>
            </button>
            {briefingOpen && (
              <div className="p-4 space-y-4 text-sm">
                {briefing.objective && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Objetivo</p>
                    <p className="whitespace-pre-wrap">{briefing.objective}</p>
                  </div>
                )}
                {briefing.projectDescription && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Descrição do projeto</p>
                    <p className="whitespace-pre-wrap">{briefing.projectDescription}</p>
                  </div>
                )}
                {briefing.services.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Entregas</p>
                    {briefing.services.map((s, i) => (
                      <div key={i} className="border border-border/60 rounded-md p-3 space-y-2 bg-card">
                        {(s.serviceType || s.objective) && (
                          <div className="flex flex-wrap gap-2 items-baseline">
                            {s.serviceType && (
                              <span className="text-sm font-semibold capitalize">{s.serviceType}</span>
                            )}
                            {s.objective && (
                              <span className="text-xs text-muted-foreground">· {s.objective}</span>
                            )}
                          </div>
                        )}
                        {s.description && (
                          <p className="text-xs whitespace-pre-wrap text-muted-foreground">{s.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                  members={members}
                  newTitle={newTitleByCol[col.key] || ''}
                  newAssignee={newAssigneeByCol[col.key] || ''}
                  newDue={newDueByCol[col.key] || ''}
                  onNewTitle={(v) => setNewTitleByCol(prev => ({ ...prev, [col.key]: v }))}
                  onNewAssignee={(v) => setNewAssigneeByCol(prev => ({ ...prev, [col.key]: v }))}
                  onNewDue={(v) => setNewDueByCol(prev => ({ ...prev, [col.key]: v }))}
                  onAdd={() => handleAdd(col.key)}
                  onDelete={handleDelete}
                  editingId={editingId}
                  editTitle={editTitle}
                  onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                  onChangeEdit={setEditTitle}
                  onSaveEdit={handleSaveEdit}
                  onToggleAssignee={handleToggleAssignee}
                  onUpdateDue={handleUpdateDue}
                />
              ))}
            </div>
            <DragOverlay>
              {activeActivity && <ActivityCard activity={activeActivity} members={members} dragging />}
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
  members,
  newTitle,
  newAssignee,
  newDue,
  onNewTitle,
  onNewAssignee,
  onNewDue,
  onAdd,
  onDelete,
  editingId,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onToggleAssignee,
  onUpdateDue,
}: {
  col: { key: ActivityStatus; label: string; dotClass: string; chipClass: string };
  activities: Activity[];
  members: MemberOption[];
  newTitle: string;
  newAssignee: string;
  newDue: string;
  onNewTitle: (v: string) => void;
  onNewAssignee: (v: string) => void;
  onNewDue: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editTitle: string;
  onStartEdit: (id: string, title: string) => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: (id: string) => void;
  onToggleAssignee: (id: string, userId: string | null) => void;
  onUpdateDue: (id: string, due: string | null) => void;
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
              members={members}
              isEditing={editingId === a.id}
              editTitle={editTitle}
              onChangeEdit={onChangeEdit}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
              onToggleAssignee={onToggleAssignee}
              onUpdateDue={onUpdateDue}
            />
          ))}
        </div>
      </SortableContext>

      <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50 mt-1">
        <div className="flex items-center gap-1.5">
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
        <Select value={newAssignee || UNASSIGNED} onValueChange={onNewAssignee}>
          <SelectTrigger className="h-7 text-xs bg-background w-full">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent className="z-[200]">
            <SelectItem value={UNASSIGNED}>Sem responsável</SelectItem>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={newDue}
          onChange={e => onNewDue(e.target.value)}
          className="h-7 text-xs bg-background w-full"
        />
      </div>
    </div>
  );
}

function SortableCard({
  activity,
  members,
  isEditing,
  editTitle,
  onChangeEdit,
  onStartEdit,
  onSaveEdit,
  onDelete,
  onToggleAssignee,
  onUpdateDue,
}: {
  activity: Activity;
  members: MemberOption[];
  isEditing: boolean;
  editTitle: string;
  onChangeEdit: (v: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAssignee: (id: string, userId: string | null) => void;
  onUpdateDue: (id: string, due: string | null) => void;
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

  const isOverdue = activity.dueDate && activity.status !== 'concluido' && activity.dueDate < new Date().toISOString().slice(0, 10);

  const assignees = activity.assignedToUserIds
    .map(uid => members.find(m => m.id === uid))
    .filter((m): m is MemberOption => !!m);
  const atMax = activity.assignedToUserIds.length >= MAX_ASSIGNEES;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border bg-card p-3 text-sm flex flex-col gap-2 hover:border-primary/40 shadow-sm"
    >
      <button
        type="button"
        onClick={() => onDelete(activity.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Title */}
      <div className="pr-5" {...(!isEditing ? { ...attributes, ...listeners } : {})}>
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
              'text-left w-full font-semibold leading-tight cursor-text break-words',
              activity.status === 'concluido' && 'line-through text-muted-foreground'
            )}
            title={activity.title}
          >
            {activity.title}
          </button>
        )}
      </div>

      {/* Responsáveis */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors -ml-0.5 px-0.5 py-0.5 rounded hover:bg-muted/60"
          >
            {assignees.length > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {assignees.map(a => {
                    const aInit = a.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
                    return (
                      <Avatar key={a.id} className="w-5 h-5 ring-1 ring-card">
                        {a.photoUrl && <AvatarImage src={a.photoUrl} alt={a.name} />}
                        <AvatarFallback className="text-[9px] bg-muted">{aInit}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                <span className="truncate">
                  {assignees.length === 1 ? assignees[0].name : `${assignees.length} responsáveis`}
                </span>
              </>
            ) : (
              <>
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[9px] bg-muted"><User className="w-3 h-3" /></AvatarFallback>
                </Avatar>
                <span className="truncate">Sem responsável</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-1 z-[200]" align="start">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Até {MAX_ASSIGNEES} responsáveis
          </div>
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => onToggleAssignee(activity.id, null)}
              className={cn(
                'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted',
                activity.assignedToUserIds.length === 0 && 'bg-muted'
              )}
            >
              Sem responsável
            </button>
            {members.map(m => {
              const mInitials = m.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
              const selected = activity.assignedToUserIds.includes(m.id);
              const disabled = !selected && atMax;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleAssignee(activity.id, m.id)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2',
                    selected && 'bg-muted',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Avatar className="w-5 h-5">
                    {m.photoUrl && <AvatarImage src={m.photoUrl} alt={m.name} />}
                    <AvatarFallback className="text-[9px] bg-muted-foreground/20">{mInitials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1">{m.name}</span>
                  {selected && <span className="text-[10px] text-primary">✓</span>}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Date */}
      <div className={cn('flex items-center gap-2 text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <input
          type="date"
          value={activity.dueDate || ''}
          onChange={(e) => onUpdateDue(activity.id, e.target.value || null)}
          className="bg-transparent outline-none cursor-pointer hover:text-foreground transition-colors flex-1"
          placeholder="Sem prazo"
        />
      </div>
    </div>
  );
}

function ActivityCard({ activity, members, dragging }: { activity: Activity; members: MemberOption[]; dragging?: boolean }) {
  const assignees = activity.assignedToUserIds
    .map(uid => members.find(m => m.id === uid))
    .filter((m): m is MemberOption => !!m);
  return (
    <div className={cn('rounded-lg border bg-card p-3 text-sm shadow-lg flex flex-col gap-2', dragging && 'rotate-2')}>
      <div className="font-semibold leading-tight">{activity.title}</div>
      {assignees.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex -space-x-1.5">
            {assignees.map(a => {
              const init = a.name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
              return (
                <Avatar key={a.id} className="w-5 h-5 ring-1 ring-card">
                  {a.photoUrl && <AvatarImage src={a.photoUrl} alt={a.name} />}
                  <AvatarFallback className="text-[9px] bg-muted">{init}</AvatarFallback>
                </Avatar>
              );
            })}
          </div>
          <span className="truncate">
            {assignees.length === 1 ? assignees[0].name : `${assignees.length} responsáveis`}
          </span>
        </div>
      )}
      {activity.dueDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />{formatDateBR(activity.dueDate)}
        </div>
      )}
    </div>
  );
}

