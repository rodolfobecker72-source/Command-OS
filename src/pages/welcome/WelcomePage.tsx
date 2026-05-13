import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, FileText, Cake, Sparkles, Target, LayoutGrid, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCRM } from '@/contexts/CRMContext';
import { useProspection } from '@/contexts/ProspectionContext';
import { supabase } from '@/integrations/supabase/client';

interface BirthdayMember {
  id: string;
  name: string;
  photo_url: string | null;
  day: number;
  birth_date: string;
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WelcomePage() {
  const { profile, workspace, role } = useAuth();
  const { projectCards, budgets } = useCRM();
  const { leads } = useProspection();
  const [birthdays, setBirthdays] = useState<BirthdayMember[]>([]);

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const firstName = profile?.name?.split(' ')[0] ?? '';
  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Operacional (time_hero): projetos
  const projectStats = useMemo(() => {
    const total = projectCards.length;
    const inProgress = projectCards.filter((p: any) =>
      ['executando', 'em_andamento', 'execucao'].includes(String(p.status).toLowerCase())
    ).length;
    const planned = projectCards.filter((p: any) =>
      ['planejado', 'planejamento'].includes(String(p.status).toLowerCase())
    ).length;
    const done = projectCards.filter((p: any) =>
      ['concluido', 'concluido', 'finalizado', 'entregue'].includes(String(p.status).toLowerCase())
    ).length;
    return { total, inProgress, planned, done };
  }, [projectCards]);

  // Vendedor: prospecção + CRM
  const salesStats = useMemo(() => {
    const activeLeads = leads.filter(
      (l) => l.funnelStatus !== 'perdido'
    ).length;
    const qualified = leads.filter((l) => l.funnelStatus === 'qualificado_crm').length;
    const pendingBudgets = budgets.filter(
      (b) => b.status !== 'aprovada' && b.status !== 'nao_aprovada'
    ).length;
    const approved = budgets.filter((b) => b.status === 'aprovada').length;
    return { activeLeads, qualified, pendingBudgets, approved };
  }, [leads, budgets]);

  // Default (owner/admin/visualizador)
  const activeProjectsCount = projectCards.length;
  const pendingBudgetsCount = useMemo(
    () =>
      budgets.filter(
        (b) => b.status !== 'aprovada' && b.status !== 'nao_aprovada'
      ).length,
    [budgets]
  );

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

      const currentMonth = now.getMonth();
      const list: BirthdayMember[] = (profiles || [])
        .map((p: any) => {
          if (!p.birth_date) return null;
          const dt = new Date(p.birth_date + 'T12:00:00');
          if (dt.getMonth() !== currentMonth) return null;
          return {
            id: p.id,
            name: p.name,
            photo_url: p.photo_url,
            day: dt.getDate(),
            birth_date: p.birth_date,
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

  return (
    <div className="min-h-screen bg-background">
      <Header title="Boas-vindas" subtitle="Um resumo rápido para começar bem o dia" />
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
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

        {/* Resumo por papel */}
        {role === 'time_hero' ? (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Gestão de Projetos
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={LayoutGrid} label="Total de projetos" value={projectStats.total} />
              <StatCard icon={Clock} label="Em andamento" value={projectStats.inProgress} />
              <StatCard icon={Briefcase} label="Planejados" value={projectStats.planned} />
              <StatCard icon={CheckCircle2} label="Concluídos" value={projectStats.done} />
            </div>
          </>
        ) : role === 'vendedor' ? (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Prospecção & CRM
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Target} label="Leads ativos" value={salesStats.activeLeads} />
              <StatCard icon={CheckCircle2} label="Qualificados p/ CRM" value={salesStats.qualified} />
              <StatCard icon={FileText} label="Propostas pendentes" value={salesStats.pendingBudgets} />
              <StatCard icon={Briefcase} label="Propostas aprovadas" value={salesStats.approved} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={Briefcase} label="Projetos ativos" value={activeProjectsCount} />
            <StatCard icon={FileText} label="Propostas pendentes" value={pendingBudgetsCount} />
          </div>
        )}

        {/* Aniversariantes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cake className="w-5 h-5 text-primary" />
              Aniversariantes do mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aniversariante este mês.
              </p>
            ) : (
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
                    </div>
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      Dia {b.day}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
