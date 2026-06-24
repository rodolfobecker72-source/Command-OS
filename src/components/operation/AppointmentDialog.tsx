import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Appointment,
  APPOINTMENT_KIND_LABELS,
  AppointmentKind,
  NewAppointmentInput,
} from '@/types/appointment';
import { useCRM } from '@/contexts/CRMContext';
import { toast } from 'sonner';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<Appointment> | null;
  defaultDate?: Date | null;
  onCreate: (input: NewAppointmentInput) => Promise<Appointment | null>;
  onUpdate?: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function toLocalInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalInputTime(d: Date): string {
  return format(d, 'HH:mm');
}

function combineDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, mm || 0, 0);
}

export function AppointmentDialog({
  open, onOpenChange, initial, defaultDate, onCreate, onUpdate, onDelete,
}: AppointmentDialogProps) {
  const { clients, budgets } = useCRM();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AppointmentKind>('reuniao');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [budgetId, setBudgetId] = useState<string>('none');
  const [clientId, setClientId] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const seedDate = initial?.startAt ?? defaultDate ?? new Date();
    const seedEnd = initial?.endAt ?? null;
    setTitle(initial?.title ?? '');
    setKind((initial?.kind as AppointmentKind) ?? 'reuniao');
    setAllDay(initial?.allDay ?? false);
    setStartDate(toLocalInputDate(seedDate));
    setStartTime(toLocalInputTime(seedDate));
    setEndDate(seedEnd ? toLocalInputDate(seedEnd) : toLocalInputDate(seedDate));
    setEndTime(seedEnd ? toLocalInputTime(seedEnd) : toLocalInputTime(seedDate));
    setLocation(initial?.location ?? '');
    setDescription(initial?.description ?? '');
    setBudgetId(initial?.budgetId ?? 'none');
    setClientId(initial?.clientId ?? 'none');
  }, [open, initial, defaultDate]);

  const sortedBudgets = useMemo(
    () => [...budgets].sort((a, b) => a.proposalId.localeCompare(b.proposalId, 'pt-BR')),
    [budgets],
  );
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.companyName.localeCompare(b.companyName, 'pt-BR')),
    [clients],
  );

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Informe um título'); return; }
    if (!startDate) { toast.error('Informe a data'); return; }

    const start = allDay
      ? combineDateTime(startDate, '00:00')
      : combineDateTime(startDate, startTime || '00:00');
    const end = allDay
      ? (endDate ? combineDateTime(endDate, '23:59') : null)
      : (endDate ? combineDateTime(endDate, endTime || startTime || '00:00') : null);

    if (end && end < start) { toast.error('Fim deve ser depois do início'); return; }

    const payload: NewAppointmentInput = {
      assignedTo: initial?.assignedTo ?? [],
      title: title.trim(),
      kind,
      description: description.trim(),
      location: location.trim(),
      startAt: start,
      endAt: end,
      allDay,
      color: initial?.color ?? null,
      budgetId: budgetId === 'none' ? null : budgetId,
      clientId: clientId === 'none' ? null : clientId,
      leadId: initial?.leadId ?? null,
    };

    setSaving(true);
    try {
      if (isEdit && initial?.id && onUpdate) {
        await onUpdate(initial.id, payload);
        toast.success('Compromisso atualizado');
      } else {
        const created = await onCreate(payload);
        if (!created) return;
        toast.success('Compromisso criado');
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial?.id || !onDelete) return;
    if (!confirm('Excluir este compromisso?')) return;
    setSaving(true);
    try {
      await onDelete(initial.id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar compromisso' : 'Novo compromisso'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="appt-title">Título *</Label>
            <Input id="appt-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião com Acme" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={v => setKind(v as AppointmentKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[200]">
                  {Object.entries(APPOINTMENT_KIND_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={allDay} onCheckedChange={setAllDay} />
              <Label className="cursor-pointer" onClick={() => setAllDay(v => !v)}>Dia inteiro</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            {!allDay && (
              <div>
                <Label>Hora início</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fim (opcional)</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            {!allDay && (
              <div>
                <Label>Hora fim</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            )}
          </div>

          {!allDay && (() => {
            const isEntrega = kind === 'entrega';
            const outOfHours =
              (startTime && (startTime < '08:00' || startTime > '18:00')) ||
              (endTime && (endTime < '08:00' || endTime > '18:00'));
            const lateDelivery = isEntrega && endTime && endTime > '18:00';
            const highlight = outOfHours || lateDelivery;
            return (
              <div className={`rounded-md border p-3 text-xs ${highlight ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-muted bg-muted/30 text-muted-foreground'}`}>
                <strong>Horário comercial:</strong> entregas de projetos ao cliente devem ocorrer no máximo entre <strong>17h e 18h</strong>, preservando o horário comercial (08h–18h).
                {lateDelivery && <div className="mt-1 font-medium">⚠ Esta entrega está fora do horário comercial recomendado.</div>}
                {outOfHours && !lateDelivery && <div className="mt-1 font-medium">⚠ Horário fora do expediente comercial (08h–18h).</div>}
              </div>
            );
          })()}

          <div>
            <Label>Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Onde será o compromisso" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Projeto (opcional)</Label>
              <Select value={budgetId} onValueChange={setBudgetId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent className="z-[200] max-h-72">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {sortedBudgets.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.proposalId} — {b.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent className="z-[200] max-h-72">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {sortedClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <div>
            {isEdit && onDelete && (
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{isEdit ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
