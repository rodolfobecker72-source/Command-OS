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
  const [connected, setConnected] = useState<{ email?: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('google-calendar-status');
      const isConnected = Boolean(data?.connected);
      setConnected(isConnected ? { email: data?.email } : null);
      return isConnected;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const handleConnect = async () => {
    const popup = window.open('', '_blank', 'width=520,height=650');
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-connect-init', {
        body: { origin: window.location.origin },
      });
      if (error || !data?.url) throw error || new Error('Sem URL');
      if (popup) {
        popup.location.href = data.url;
      } else {
        window.location.href = data.url;
      }

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await new Promise((r) => setTimeout(r, 2000));
        if (await load()) {
          toast({ title: 'Google Calendar conectado' });
          try { popup?.close(); } catch { /* ignore */ }
          return;
        }
      }

      toast({
        title: 'Conexão ainda não confirmada',
        description: 'Se a janela do Google fechou sem confirmar, tente novamente.',
      });
    } catch (e: any) {
      try { popup?.close(); } catch { /* ignore */ }
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
            <span className="font-medium">{connected.email || 'Conectado'}</span>
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
