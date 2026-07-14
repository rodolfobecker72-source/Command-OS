import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    const { data } = await supabase
      .from('user_google_tokens')
      .select('google_email')
      .eq('user_id', user.id)
      .maybeSingle();
    const nextConnected = data ? { email: data.google_email } : null;
    setConnected(nextConnected);
    setLoading(false);
    return Boolean(nextConnected);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Recarrega ao voltar foco (após popup OAuth fechar)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handleConnect = async () => {
    const popup = window.open('', '_blank');
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-oauth-start', {
        body: { return_to: window.location.pathname },
      });
      if (error || !data?.url) throw error || new Error('Sem URL');
      // A aba é criada imediatamente no clique e só depois recebe a URL,
      // evitando que o navegador trate o OAuth como popup não solicitado.
      if (popup) {
        popup.location.href = data.url;
      } else {
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

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const isConnected = await load();
        if (isConnected) {
          toast({ title: 'Google Calendar conectado' });
          return;
        }
      }

      toast({
        title: 'Conexão ainda não confirmada',
        description: 'Se o Google exibiu um bloqueio, adicione este e-mail como usuário de teste no OAuth do Google ou publique o app OAuth.',
      });
    } catch (e: any) {
      popup?.close();
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
