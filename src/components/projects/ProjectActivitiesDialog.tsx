function Column({
  col,
  activities,
  members,
  newTitle,
  newAssignee,
  newDue,
  newFreela,
  onNewTitle,
  onNewAssignee,
  onNewDue,
  onNewFreela,
  onAdd,
  onDelete,
  editingId,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onToggleAssignee,
  onUpdateDue,
  onUpdateFreela,
}: {
  col: { key: ActivityStatus; label: string; dotClass: string; chipClass: string };
  activities: Activity[];
  members: MemberOption[];
  newTitle: string;
  newAssignee: string;
  newDue: string;
  newFreela: string;
  onNewTitle: (v: string) => void;
  onNewAssignee: (v: string) => void;
  onNewDue: (v: string) => void;
  onNewFreela: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editTitle: string;
  onStartEdit: (id: string, title: string) => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: (id: string) => void;
  onToggleAssignee: (id: string, userId: string | null) => void;
  onUpdateDue: (id: string, due: string | null) => void;
  onUpdateFreela: (id: string, name: string | null) => void;
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
              onUpdateFreela={onUpdateFreela}
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
            <SelectItem value="__freela__">Freela</SelectItem>
          </SelectContent>
        </Select>
        {newAssignee === '__freela__' && (
          <Input
            value={newFreela}
            onChange={e => onNewFreela(e.target.value)}
            placeholder="Nome do freela"
            className="h-7 text-xs bg-background w-full"
          />
        )}
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
  onUpdateFreela,
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
  onUpdateFreela: (id: string, name: string | null) => void;
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
  const hasFreela = !!activity.freelaName;

  const [freelaInput, setFreelaInput] = useState(activity.freelaName || '');
  useEffect(() => { setFreelaInput(activity.freelaName || ''); }, [activity.freelaName]);

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
            {assignees.length > 0 || hasFreela ? (
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
                  {hasFreela && (
                    <Avatar className="w-5 h-5 ring-1 ring-card bg-amber-100">
                      <AvatarFallback className="text-[9px] text-amber-700 font-bold">F</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <span className="truncate">
                  {hasFreela && assignees.length === 0 ? activity.freelaName : assignees.length === 1 ? assignees[0].name : assignees.length > 1 ? `${assignees.length} responsáveis` : ''}
                  {hasFreela && assignees.length > 0 ? ` · ${activity.freelaName}` : ''}
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
            <div className="border-t border-border my-1" />
            <div className="px-2 py-1 space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Freela</div>
              <div className="flex gap-1">
                <Input
                  value={freelaInput}
                  onChange={e => setFreelaInput(e.target.value)}
                  placeholder="Nome do freela"
                  className="h-7 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onUpdateFreela(activity.id, freelaInput.trim() || null);
                  }}
                >
                  OK
                </Button>
              </div>
              {activity.freelaName && (
                <button
                  type="button"
                  onClick={() => onUpdateFreela(activity.id, null)}
                  className="text-[10px] text-muted-foreground hover:text-destructive underline"
                >
                  Remover freela
                </button>
              )}
            </div>
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
  const hasFreela = !!activity.freelaName;
  return (
    <div className={cn('rounded-lg border bg-card p-3 text-sm shadow-lg flex flex-col gap-2', dragging && 'rotate-2')}>
      <div className="font-semibold leading-tight">{activity.title}</div>
      {(assignees.length > 0 || hasFreela) && (
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
            {hasFreela && (
              <Avatar className="w-5 h-5 ring-1 ring-card bg-amber-100">
                <AvatarFallback className="text-[9px] text-amber-700 font-bold">F</AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className="truncate">
            {hasFreela && assignees.length === 0 ? activity.freelaName : assignees.length === 1 ? assignees[0].name : assignees.length > 1 ? `${assignees.length} responsáveis` : ''}
            {hasFreela && assignees.length > 0 ? ` · ${activity.freelaName}` : ''}
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
