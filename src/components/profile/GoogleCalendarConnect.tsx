import { useEffect, useState } from 'react';
import { Calendar, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function GoogleCalendarConnect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState<{ email: string } | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_google_tokens')
      .select('google_email')
      .eq('user_id', user.id)
      .maybeSingle();
    setConnected(data ? { email: data.google_email } : null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  // Recarrega ao voltar foco (após popup OAuth fechar)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth-start', {
        body: { return_to: window.location.pathname },
      });
      if (error || !data?.url) throw error || new Error('Sem URL');
      // Abre em nova aba de nível superior (sem opener) para evitar bloqueio
      // do Google quando o app está dentro de um iframe (preview do Lovable).
      const newTab = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!newTab) {
        // Fallback: se popup bloqueado, navega a janela top-level inteira.
        try {
          if (window.top) {
            window.top.location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } catch {
          window.location.href = data.url;
        }
      }
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar conexão', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Desconectar o Google Calendar? Eventos já criados continuarão no Google.')) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-disconnect');
      if (error) throw error;
      toast({ title: 'Desconectado do Google Calendar' });
      setConnected(null);
    } catch (e: any) {
      toast({ title: 'Erro ao desconectar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">Google Calendar</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Sincronize suas atividades de projeto com a sua agenda do Google. Cada atividade com data e responsável vira um evento no seu calendário.
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Carregando…
        </div>
      ) : connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-success" />
            <span className="font-medium">{connected.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={busy}>
            {busy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
            Desconectar
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={handleConnect} disabled={busy}>
          {busy && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          Conectar Google Calendar
        </Button>
      )}
    </div>
  );
}
