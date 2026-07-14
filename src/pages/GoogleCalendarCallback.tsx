// Landing page after the connector gateway completes Google OAuth for the popup.
// Just shows a confirmation and closes; the opener page polls the status endpoint.
import { useEffect } from 'react';
import { Check } from 'lucide-react';

export default function GoogleCalendarCallback() {
  useEffect(() => {
    const t = setTimeout(() => {
      try { window.close(); } catch { /* ignore */ }
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-3 max-w-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="w-6 h-6 text-success" />
        </div>
        <h1 className="text-lg font-semibold">Google Calendar conectado</h1>
        <p className="text-sm text-muted-foreground">
          Você já pode fechar esta janela e voltar para o Hero Command.
        </p>
      </div>
    </div>
  );
}
