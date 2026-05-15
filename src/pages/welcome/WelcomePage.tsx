import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, Sparkles, AlertTriangle, Play, Calendar, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BirthdayMember {
  id: string;
  name: string;
  photo_url: string | null;
  day: number;
  month: number;
  weekday: string;
}

interface ActivityItem {
  id: string;
  title: string;
  dueDate: string | null;
  projectName: string;
  isOverdue: boolean;
  freelaName: string | null;
}

interface UserActivities {
  userId: string;
  name: string;
  photoUrl: string | null;
  overdue: ActivityItem[];
  toStart: ActivityItem[];
}

type LeadAlertStatus = 'overdue' | 'today' | 'tomorrow';
interface LeadAlertItem {
  id: string;
  companyName: string;
  nextAction: string;
  nextActionDate: string;
  status: LeadAlertStatus;
}

function formatDateBR(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Returns today (start) and today + 5 days (end)
function getUpcomingRange(ref: Date) {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 5);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function WelcomePage() {
  const { profile, workspace } = useAuth();
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivities[]>([]);
  const [leadAlerts, setLeadAlerts] = useState<LeadAlertItem[]>([]);

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const firstName = profile?.name?.split(' ')[0] ?? '';
  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    let cancelled = false;
    const loadBirthdays = async () => {
      if (!workspace) return;
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspace.id);
      if (!members || members.length === 0) {
        if (!cancelled) setBirthdays([]);
        return;
      }
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, photo_url, birth_date')
        .in('id', userIds)
        .not('birth_date', 'is', null);

      const { start, end } = getUpcomingRange(now);
      const year = now.getFullYear();

      const list: BirthdayMember[] = (profiles || [])
        .map((p: any) => {
          if (!p.birth_date) return null;
          const dt = new Date(p.birth_date + 'T12:00:00');
          // Build this year's birthday occurrence
          const occ = new Date(year, dt.getMonth(), dt.getDate(), 12, 0, 0);
          if (occ < start || occ > end) return null;
          return {
            id: p.id,
            name: p.name,
            photo_url: p.photo_url,
            day: dt.getDate(),
            month: dt.getMonth() + 1,
            weekday: occ.toLocaleDateString('pt-BR', { weekday: 'long' }),
          } as BirthdayMember;
        })
        .filter(Boolean) as BirthdayMember[];

      list.sort((a, b) => a.day - b.day);
      if (!cancelled) setBirthdays(list);
    };
    loadBirthdays();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadActivities = async () => {
      if (!workspace || !profile?.id) return;
      const today = new Date().toISOString().slice(0, 10);

      const { data: activities } = await supabase
        .from('project_activities')
      .select('id, title, status, due_date, assigned_to_user_id, assigned_to_user_ids, project_card_id, freela_name')
        .eq('workspace_id', workspace.id)
        .or(`assigned_to_user_id.eq.${profile.id},assigned_to_user_ids.cs.{${profile.id}}`)
        .neq('status', 'concluido');

      if (!activities || activities.length === 0) {
        if (!cancelled) setUserActivities([]);
        return;
      }

      const cardIds = Array.from(new Set(activities.map((a: any) => a.project_card_id).filter(Boolean)));

      const [{ data: cards }, { data: prof }] = await Promise.all([
        cardIds.length
          ? supabase.from('project_cards').select('id, project_name').in('id', cardIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from('profiles').select('id, name, photo_url').eq('id', profile.id).maybeSingle(),
      ]);

      const cardMap = new Map((cards || []).map((c: any) => [c.id, c.project_name]));
      const me = prof as any;
      if (!me) {
        if (!cancelled) setUserActivities([]);
        return;
      }

      const bucket: UserActivities = {
        userId: profile.id,
        name: me.name || 'Sem nome',
        photoUrl: me.photo_url || null,
        overdue: [],
        toStart: [],
      };

      for (const a of activities as any[]) {
        const ids: string[] = Array.isArray(a.assigned_to_user_ids) && a.assigned_to_user_ids.length > 0
          ? a.assigned_to_user_ids
          : (a.assigned_to_user_id ? [a.assigned_to_user_id] : []);
        if (!ids.includes(profile.id)) continue;
        const item: ActivityItem = {
          id: a.id,
          title: a.title,
          dueDate: a.due_date,
          projectName: cardMap.get(a.project_card_id) || 'Projeto',
          isOverdue: !!a.due_date && a.due_date < today,
          freelaName: a.freela_name || null,
        };
        if (item.isOverdue) bucket.overdue.push(item);
        else if (a.status === 'nao_iniciado') bucket.toStart.push(item);
      }

      const list = (bucket.overdue.length > 0 || bucket.toStart.length > 0) ? [bucket] : [];

      if (!cancelled) setUserActivities(list);
    };
    loadActivities();
    return () => { cancelled = true; };
  }, [workspace?.id, profile?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadLeadAlerts = async () => {
      if (!workspace || !profile?.id) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const { data: leads } = await supabase
        .from('prospection_leads')
        .select('id, company_name, next_action, next_action_date, funnel_status, responsible_user_id')
        .eq('workspace_id', workspace.id)
        .eq('responsible_user_id', profile.id);

      const items: LeadAlertItem[] = [];
      for (const l of (leads || []) as any[]) {
        if (['perdido', 'qualificado_crm'].includes(l.funnel_status)) continue;
        const d = (l.next_action_date || '').slice(0, 10);
        if (!d) continue;
        let status: LeadAlertStatus | null = null;
        if (d < todayStr) status = 'overdue';
        else if (d === todayStr) status = 'today';
        else if (d === tomorrowStr) status = 'tomorrow';
        if (!status) continue;
        items.push({
          id: l.id,
          companyName: l.company_name,
          nextAction: l.next_action || '',
          nextActionDate: d,
          status,
        });
      }
      const order: Record<LeadAlertStatus, number> = { overdue: 0, today: 1, tomorrow: 2 };
      items.sort((a, b) => order[a.status] - order[b.status] || a.nextActionDate.localeCompare(b.nextActionDate));
      if (!cancelled) setLeadAlerts(items);
    };
    loadLeadAlerts();
    return () => { cancelled = true; };
  }, [workspace?.id, profile?.id]);

  const handleCompleteActivity = async (activityId: string) => {
    // Optimistic remove
    setUserActivities((prev) =>
      prev
        .map((u) => ({
          ...u,
          overdue: u.overdue.filter((a) => a.id !== activityId),
          toStart: u.toStart.filter((a) => a.id !== activityId),
        }))
        .filter((u) => u.overdue.length > 0 || u.toStart.length > 0)
    );
    const { error } = await supabase
      .from('project_activities')
      .update({ status: 'concluido' })
      .eq('id', activityId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível concluir a tarefa.', variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa concluída' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Boas-vindas" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        {/* Saudação */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 shrink-0 mt-1 opacity-90" />
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {greeting}{firstName ? `, ${firstName}` : ''}!
                </h2>
                <p className="text-sm md:text-base mt-1 opacity-90 capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aniversariantes da semana */}
        {birthdays.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="w-5 h-5 text-primary" />
                Aniversariantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {birthdays.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={b.photo_url || undefined} alt={b.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(b.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.weekday}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {String(b.day).padStart(2, '0')}/{String(b.month).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Atividades operacionais por usuário */}
        {userActivities.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Atividades operacionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {userActivities.map((u) => (
                  <li key={u.userId} className="border border-border/60 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.photoUrl || undefined} alt={u.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{u.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {u.overdue.length > 0 && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                              {u.overdue.length} em atraso
                            </Badge>
                          )}
                          {u.toStart.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              {u.toStart.length} para iniciar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {u.overdue.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Em atraso
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {u.overdue.map((a) => (
                            <div
                              key={a.id}
                              className="border border-destructive/30 bg-destructive/5 rounded-lg p-3 flex items-start gap-2.5 shadow-sm"
                            >
                              <Checkbox
                                className="mt-0.5"
                                onCheckedChange={(c) => c && handleCompleteActivity(a.id)}
                                aria-label="Concluir tarefa"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-medium leading-snug break-words">{a.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{a.projectName}</p>
                                {a.freelaName && (
                                  <p className="text-xs text-amber-600 font-medium tabular-nums flex items-center gap-1">
                                    <span className="inline-block w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center">F</span>
                                    {a.freelaName}
                                  </p>
                                )}
                                <p className="text-xs text-destructive font-semibold tabular-nums">
                                  Vence em {formatDateBR(a.dueDate)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {u.toStart.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Play className="w-3.5 h-3.5" /> Para iniciar
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {u.toStart.map((a) => (
                            <div
                              key={a.id}
                              className="border border-border bg-muted/30 rounded-lg p-3 flex items-start gap-2.5 shadow-sm"
                            >
                              <Checkbox
                                className="mt-0.5"
                                onCheckedChange={(c) => c && handleCompleteActivity(a.id)}
                                aria-label="Concluir tarefa"
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-medium leading-snug break-words">{a.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{a.projectName}</p>
                                {a.freelaName && (
                                  <p className="text-xs text-amber-600 font-medium tabular-nums flex items-center gap-1">
                                    <span className="inline-block w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center">F</span>
                                    {a.freelaName}
                                  </p>
                                )}
                                {a.dueDate && (
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatDateBR(a.dueDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Próximas ações de leads (prospecção) */}
        {leadAlerts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Leads — próxima ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {leadAlerts.map((l) => {
                  const styles =
                    l.status === 'overdue'
                      ? 'border-destructive/30 bg-destructive/5'
                      : l.status === 'today'
                      ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/20'
                      : 'border-primary/30 bg-primary/5';
                  const label =
                    l.status === 'overdue' ? 'Em atraso' : l.status === 'today' ? 'Hoje' : 'Amanhã';
                  const badgeVariant: 'destructive' | 'secondary' | 'default' =
                    l.status === 'overdue' ? 'destructive' : l.status === 'today' ? 'default' : 'secondary';
                  return (
                    <li
                      key={l.id}
                      className={`border ${styles} rounded-lg p-3 flex items-start gap-2.5 shadow-sm`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{l.companyName}</p>
                          <Badge variant={badgeVariant} className="text-[10px] py-0 px-1.5">
                            {label}
                          </Badge>
                        </div>
                        {l.nextAction && (
                          <p className="text-xs text-muted-foreground break-words">{l.nextAction}</p>
                        )}
                        <p className="text-xs font-medium tabular-nums">
                          Próxima ação em {formatDateBR(l.nextActionDate)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
