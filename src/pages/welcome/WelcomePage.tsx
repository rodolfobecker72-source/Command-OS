import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, Sparkles, AlertTriangle, Play, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BirthdayMember {
  id: string;
  name: string;
  photo_url: string | null;
  day: number;
  month: number;
  weekday: string;
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Returns Sunday (start) and Saturday (end) of current week
function getWeekRange(ref: Date) {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function WelcomePage() {
  const { profile, workspace } = useAuth();
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

      const { start, end } = getWeekRange(now);
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
                Aniversariantes da semana
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
      </div>
    </div>
  );
}
