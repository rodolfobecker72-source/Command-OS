import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  Briefcase,
  Users,
  Target,
  Kanban,
  FolderKanban,
  Calendar,
  DollarSign,
  FileText,
  BarChart3,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import heroLogo from '@/assets/command-logo.png';

const features = [
  { icon: Target, title: 'Prospecção', desc: 'Funil de leads com próximas ações e responsáveis.' },
  { icon: Users, title: 'Clientes', desc: 'Base completa com score, histórico e segmentação.' },
  { icon: Kanban, title: 'CRM & Orçamentos', desc: 'Pipeline visual com propostas, margem e impostos.' },
  { icon: FolderKanban, title: 'Área de Projetos', desc: 'Kanban de atividades e acompanhamento por projeto.' },
  { icon: Calendar, title: 'Calendário', desc: 'Agenda integrada de entregas e gravações.' },
  { icon: DollarSign, title: 'Financeiro', desc: 'Fluxo de caixa, contas, cartões e projeções.' },
  { icon: FileText, title: 'Propostas em PDF', desc: 'Layout personalizado com marca da sua produtora.' },
  { icon: BarChart3, title: 'Metas & Score', desc: 'Metas mensais e score de clientes automatizados.' },
  { icon: ShieldCheck, title: 'Permissões', desc: 'Controle de acesso por papel e por página.' },
];

const audience = [
  'Produtoras audiovisuais que querem profissionalizar a gestão comercial',
  'Times comerciais que precisam de previsibilidade de receita',
  'Gestores que querem visibilidade do funil, execução e financeiro',
  'Estúdios que entregam projetos sob demanda e precisam controlar margem',
];

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(100),
  phone: z.string().trim().min(8, 'Informe um telefone válido').max(20),
  email: z.string().trim().email('E-mail inválido').max(255),
});

export default function HomePage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: 'Verifique os dados', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('landing_leads').insert({
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.phone,
      company: '',
      instagram: '',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
      return;
    }
    setSent(true);
    setForm({ name: '', phone: '', email: '' });
    toast({ title: 'Recebemos seu contato!', description: 'Em breve entraremos em contato.' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-center">
          <img src={heroLogo} alt="Command OS" className="h-10 w-auto" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" /> Sistema completo para produtoras audiovisuais
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Comando total da sua <span className="text-primary">produtora</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Do primeiro contato até a entrega: prospecção, CRM, projetos e financeiro em uma única plataforma pensada para o audiovisual.
          </p>
          <a href="#lead">
            <Button size="lg" className="h-12 px-8 text-base">
              Quero conhecer o sistema
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Tudo o que sua produtora precisa</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para o dia a dia de quem vende, executa e entrega projetos audiovisuais.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Para quem é */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Briefcase className="h-3.5 w-3.5" /> Para quem é
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Feito para o audiovisual</h2>
              <p className="text-muted-foreground">
                O Command OS foi desenhado para produtoras que querem transformar o comercial em processo — e processo em crescimento.
              </p>
            </div>
            <ul className="space-y-3">
              {audience.map((a) => (
                <li key={a} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Prints */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Veja por dentro</h2>
          <p className="text-muted-foreground">Uma prévia de como sua operação fica organizada.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mock CRM Kanban */}
          <Card className="overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium">CRM — Pipeline</span>
              <span className="text-xs text-muted-foreground">Maio 2026</span>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { col: 'Oportunidade', items: ['Filme Acme', 'Reels Nova'], color: 'bg-status-opportunity' },
                  { col: 'Em proposta', items: ['Vídeo Lumen', 'Doc Vértice'], color: 'bg-status-proposal' },
                  { col: 'Aprovado', items: ['Campanha Orbe'], color: 'bg-status-approved' },
                ].map((c) => (
                  <div key={c.col} className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`h-2 w-2 rounded-full ${c.color}`} />
                      <span className="font-medium text-foreground">{c.col}</span>
                    </div>
                    <div className="space-y-1.5">
                      {c.items.map((i) => (
                        <div key={i} className="bg-card border rounded p-2 shadow-sm">
                          <div className="font-medium text-foreground">{i}</div>
                          <div className="text-muted-foreground text-[10px] mt-1">R$ 28.500</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mock Dashboard */}
          <Card className="overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Dashboard Comercial</span>
              <span className="text-xs text-muted-foreground">Tempo real</span>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Receita', v: 'R$ 184k' },
                  { l: 'Aprovados', v: '12' },
                  { l: 'Margem', v: '38%' },
                ].map((m) => (
                  <div key={m.l} className="bg-muted/30 rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.l}</div>
                    <div className="text-lg font-bold text-foreground">{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="h-28 bg-muted/30 rounded-lg p-3 flex items-end gap-1.5">
                {[40, 65, 50, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mock Projects */}
          <Card className="overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b">
              <span className="text-sm font-medium">Área de Projetos</span>
            </div>
            <CardContent className="p-5 space-y-2 text-xs">
              {[
                { p: 'Filme institucional Acme', s: 'Em produção', c: 'bg-info text-info-foreground' },
                { p: 'Reels Nova Coleção', s: 'Edição', c: 'bg-warning text-warning-foreground' },
                { p: 'Doc Vértice ep.02', s: 'Entregue', c: 'bg-success text-success-foreground' },
                { p: 'Campanha Orbe', s: 'Pré-produção', c: 'bg-secondary text-secondary-foreground' },
              ].map((p) => (
                <div key={p.p} className="flex items-center justify-between bg-card border rounded-lg p-3">
                  <span className="font-medium text-foreground">{p.p}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.c}`}>{p.s}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mock Financeiro */}
          <Card className="overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b">
              <span className="text-sm font-medium">Financeiro — Fluxo de caixa</span>
            </div>
            <CardContent className="p-5 space-y-2 text-xs">
              {[
                { d: 'Recebimento — Acme', v: '+ R$ 14.500', pos: true },
                { d: 'Pagto. equipe — Filme Nova', v: '- R$ 6.200', pos: false },
                { d: 'Recebimento — Vértice', v: '+ R$ 9.800', pos: true },
                { d: 'Locação de equipamento', v: '- R$ 2.400', pos: false },
              ].map((t) => (
                <div key={t.d} className="flex items-center justify-between bg-card border rounded-lg p-3">
                  <span className="text-foreground">{t.d}</span>
                  <span className={`font-semibold ${t.pos ? 'text-success' : 'text-destructive'}`}>{t.v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lead form */}
      <section id="lead" className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Quer conhecer o Command OS?</h2>
            <p className="text-primary-foreground/85">
              Deixe seus dados e nossa equipe entra em contato para uma demonstração.
            </p>
          </div>

          <Card className="text-foreground">
            <CardContent className="p-6 md:p-8">
              {sent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <h3 className="text-xl font-semibold mb-1">Recebemos seu contato!</h3>
                  <p className="text-muted-foreground text-sm">Em breve entraremos em contato.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Seu nome completo"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        maxLength={20}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="voce@produtora.com"
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
                    {loading ? 'Enviando...' : 'Quero uma demonstração'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={heroLogo} alt="Command OS" className="h-8 w-auto" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Command OS — Hero Audiovisual</p>
        </div>
      </footer>
    </div>
  );
}
