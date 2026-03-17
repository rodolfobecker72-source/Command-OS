import { useState } from 'react';
import commandLogo from '@/assets/command-logo.png';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2 } from 'lucide-react';

export function MaintenancePage() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    instagram: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      toast.error('Preencha os campos obrigatórios: Produtora, E-mail e WhatsApp.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('landing_leads' as any).insert({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        instagram: form.instagram.trim(),
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success('Dados enviados com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8"
      style={{ background: 'radial-gradient(ellipse at 30% 50%, #1a237e 0%, #0a1045 40%, #060d2e 100%)' }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img
            src={commandLogo}
            alt="Command OS"
            className="h-14 w-auto mx-auto brightness-0 invert"
          />
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Em breve
            </h1>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Estamos preparando novidades para você.<br />
              Cadastre-se para receber mais informações.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Send className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Obrigado!</h2>
            <p className="text-white/70 text-sm">
              Seus dados foram recebidos. Entraremos em contato em breve.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-white/90 text-xs">Nome</Label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/90 text-xs">
                Produtora <span className="text-red-400">*</span>
              </Label>
              <Input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Nome da produtora"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/90 text-xs">
                E-mail <span className="text-red-400">*</span>
              </Label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/90 text-xs">
                WhatsApp <span className="text-red-400">*</span>
              </Label>
              <Input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/90 text-xs">Instagram</Label>
              <Input
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="@seu_instagram"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-white/90 font-semibold mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </Button>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse [animation-delay:0.3s]" />
          <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse [animation-delay:0.6s]" />
        </div>
      </div>
    </div>
  );
}
