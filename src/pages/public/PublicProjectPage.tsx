import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ExternalLink, Eye, Calendar, User, Package } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ActivityStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

interface Activity {
  id: string;
  title: string;
  status: ActivityStatus;
  order: number;
  assignedToUserIds: string[];
  dueDate: string | null;
  endDate: string | null;
  isDelivery: boolean;
  freelaName: string | null;
}

interface Member {
  id: string;
  name: string;
  photo_url: string | null;
}

interface CardInfo {
  id: string;
  projectName: string;
  clientName: string | null;
  proposalId: string | null;
  materialLinks: string[];
}

const COLUMNS: { key: ActivityStatus; label: string; dotClass: string; chipClass: string; colBg: string; cardBg: string; cardBorder: string }[] = [
  { key: 'nao_iniciado', label: 'Não iniciado', dotClass: 'bg-muted-foreground', chipClass: 'bg-muted text-muted-foreground', colBg: 'bg-muted/40', cardBg: 'bg-background/60', cardBorder: 'border-border/60' },
  { key: 'em_andamento', label: 'Em andamento', dotClass: 'bg-info', chipClass: 'bg-info/15 text-info', colBg: 'bg-info/[0.06]', cardBg: 'bg-info/[0.08]', cardBorder: 'border-info/25' },
  { key: 'concluido', label: 'Concluído', dotClass: 'bg-success', chipClass: 'bg-success/15 text-success', colBg: 'bg-success/[0.06]', cardBg: 'bg-success/[0.08]', cardBorder: 'border-success/25' },
];

function formatDateBR(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

export default function PublicProjectPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardInfo | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!cardId) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    let cancelled = false;

    const fetchData = (initial: boolean) => {
      return fetch(`${supabaseUrl}/functions/v1/public-project-view?cardId=${encodeURIComponent(cardId)}`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      })
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body?.error || 'Erro ao carregar');
          if (cancelled) return;
          setCard(body.card);
          setActivities(body.activities || []);
          setMembers(body.members || []);
          if (initial) setError(null);
        })
        .catch((e) => { if (initial && !cancelled) setError(String(e.message || e)); })
        .finally(() => { if (initial && !cancelled) setLoading(false); });
    };

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [cardId]);


  const memberById = new Map(members.map((m) => [m.id, m]));
  const grouped: Record<ActivityStatus, Activity[]> = { nao_iniciado: [], em_andamento: [], concluido: [] };
  for (const a of [...activities].sort((a, b) => a.order - b.order)) grouped[a.status].push(a);
  const total = activities.length;
  const done = activities.filter((a) => a.status === 'concluido').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando projeto...
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <p className="text-lg font-semibold mb-2">Projeto não encontrado</p>
          <p className="text-sm text-muted-foreground">{error || 'Verifique o link e tente novamente.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* View-only banner */}
      <div className="bg-primary/10 border-b border-primary/20 text-primary">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-medium">Acompanhamento somente para visualização — nenhuma alteração pode ser feita nesta página.</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Acompanhamento de projeto</p>
          <h1 className="text-2xl md:text-3xl font-bold">
            {card.proposalId && <span className="text-muted-foreground mr-2">{card.proposalId} —</span>}
            {card.projectName}
          </h1>
          {card.clientName && (
            <p className="text-sm text-muted-foreground">Cliente: {card.clientName}</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 max-w-md h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums">{pct}%</span>
            <span className="text-xs text-muted-foreground">({done}/{total})</span>
          </div>
        </div>

        {/* External links */}
        {card.materialLinks.length > 0 && (
          <div className="rounded-lg border border-border p-4 space-y-2 bg-card">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Materiais do projeto</p>
            <ul className="space-y-1">
              {card.materialLinks.map((url, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary hover:underline" title={url}>
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Kanban */}
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade cadastrada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.key} className={cn('rounded-xl p-3 flex flex-col gap-3 min-h-[260px]', col.colBg)}>
                <div className={cn('inline-flex items-center gap-2 self-start px-2.5 py-0.5 rounded-full text-xs font-medium', col.chipClass)}>
                  <span className={cn('w-2 h-2 rounded-full', col.dotClass)} />
                  {col.label}
                  <span className="opacity-60">({grouped[col.key].length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {grouped[col.key].map((a) => {
                    const assignees = a.assignedToUserIds.map((id) => memberById.get(id)).filter(Boolean) as Member[];
                    return (
                      <div key={a.id} className={cn('rounded-lg border p-3 space-y-2', col.cardBorder, col.cardBg)}>
                        <div className="flex items-start gap-2">
                          {a.isDelivery && <Package className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                          <p className="text-sm font-medium flex-1 break-words">{a.title}</p>
                        </div>
                        {(assignees.length > 0 || a.freelaName) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {assignees.map((m) => {
                              const initials = (m.name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
                              return (
                                <div key={m.id} className="flex items-center gap-1 text-xs bg-background/70 rounded-full pl-0.5 pr-2 py-0.5">
                                  <Avatar className="w-4 h-4">
                                    {m.photo_url && <AvatarImage src={m.photo_url} alt={m.name} />}
                                    <AvatarFallback className="text-[8px] bg-muted">{initials}</AvatarFallback>
                                  </Avatar>
                                  <span>{m.name.split(' ')[0]}</span>
                                </div>
                              );
                            })}
                            {a.freelaName && (
                              <span className="text-xs bg-background/70 rounded-full px-2 py-0.5 text-muted-foreground">
                                {a.freelaName}
                              </span>
                            )}

                          </div>
                        )}
                        {(a.dueDate || a.endDate) && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDateBR(a.dueDate)}
                              {a.endDate && ` → ${formatDateBR(a.endDate)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {grouped[col.key].length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">Sem atividades</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Esta é uma página de acompanhamento somente leitura.
        </p>
      </div>
    </div>
  );
}
