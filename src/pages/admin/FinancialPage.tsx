import React, { useState, useEffect, useMemo } from 'react';

import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Trash2, ExternalLink, Landmark } from 'lucide-react';

interface BudgetWithVersions {
  id: string;
  proposal_id: string;
  project_name: string;
  client_id: string;
  execution_month: string | null;
  final_value: number | null;
  approved_version: number | null;
  status: string;
  execution: any;
  nf_url: string | null;
}

interface FinancialAccount {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  bank: string;
  agency: string;
  account_number: string;
  is_active: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'carteira_digital', label: 'Carteira Digital' },
  { value: 'outro', label: 'Outro' },
];

const currencyFmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FinancialPage() {
  const { workspace } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(now, 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetWithVersions[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Account form state
  const [accountDialog, setAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', type: 'corrente', bank: '', agency: '', account_number: '' });

  useEffect(() => {
    if (workspace?.id) loadData();
  }, [workspace?.id]);

  async function loadData() {
    setLoading(true);
    const wid = workspace!.id;

    const [bRes, vRes, cRes, aRes, gRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('workspace_id', wid).in('status', ['aprovada', 'em_execucao', 'concluido']),
      supabase.from('budget_versions').select('*').eq('workspace_id', wid),
      supabase.from('clients').select('id, company_name').eq('workspace_id', wid),
      supabase.from('financial_accounts').select('*').eq('workspace_id', wid).order('name'),
      supabase.from('monthly_goals').select('*').eq('workspace_id', wid),
    ]);

    if (bRes.data) setBudgets(bRes.data as any);
    if (vRes.data) setVersions(vRes.data);
    if (cRes.data) {
      const map: Record<string, string> = {};
      cRes.data.forEach((c: any) => { map[c.id] = c.company_name; });
      setClients(map);
    }
    if (aRes.data) setAccounts(aRes.data as any);
    if (gRes.data) {
      const gmap: Record<string, number> = {};
      gRes.data.forEach((g: any) => { gmap[g.month] = Number(g.value); });
      setGoals(gmap);
    }
    setLoading(false);
  }

  // Monthly projects
  const monthlyProjects = useMemo(() => {
    return budgets
      .filter(b => b.execution_month === selectedMonth)
      .map(b => {
        const approvedVer = b.approved_version != null
          ? versions.find(v => v.budget_id === b.id && v.version === b.approved_version)
          : versions.filter(v => v.budget_id === b.id).sort((a, c) => c.version - a.version)[0];

        const services: any[] = approvedVer?.services || [];
        const executionData = b.execution as any;
        const realCosts = executionData?.realCosts || {};
        const nfCost = executionData?.nfCost || 0;

        let totalValue = 0;
        let totalRealCost = 0;
        const serviceDetails = services.map((s: any, idx: number) => {
          const sValue = Number(s.subtotal || s.totalPrice || 0);
          const sRealCost = Number(realCosts[s.id] ?? s.productionCost ?? 0);
          totalValue += sValue;
          totalRealCost += sRealCost;
          return {
            id: s.id || `svc-${idx}`,
            name: s.name || s.categoryLabel || 'Serviço',
            categoryLabel: s.categoryLabel || '',
            value: sValue,
            realCost: sRealCost,
            margin: sValue - sRealCost,
            marginPercent: sValue > 0 ? ((sValue - sRealCost) / sValue) * 100 : 0,
          };
        });

        const finalValue = b.final_value || totalValue;
        const margin = finalValue - totalRealCost - nfCost;

        return {
          id: b.id,
          proposalId: b.proposal_id,
          projectName: b.project_name,
          clientName: clients[b.client_id] || '—',
          services: serviceDetails,
          totalValue: finalValue,
          totalRealCost,
          nfCost,
          margin,
          marginPercent: finalValue > 0 ? (margin / finalValue) * 100 : 0,
          status: b.status,
        };
      });
  }, [budgets, versions, clients, selectedMonth]);

  // Annual data
  const annualData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date(selectedYear, 0)),
      end: endOfYear(new Date(selectedYear, 0)),
    });

    return months.map(m => {
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM', { locale: ptBR });
      const monthBudgets = budgets.filter(b => b.execution_month === key);

      let faturamento = 0;
      let custoReal = 0;

      monthBudgets.forEach(b => {
        const approvedVer = b.approved_version != null
          ? versions.find(v => v.budget_id === b.id && v.version === b.approved_version)
          : versions.filter(v => v.budget_id === b.id).sort((a, c) => c.version - a.version)[0];

        const executionData = b.execution as any;
        const nfCost = Number(executionData?.nfCost || 0);
        const realCosts = executionData?.realCosts || {};

        faturamento += b.final_value || Number(approvedVer?.full_price || 0);
        const services: any[] = approvedVer?.services || [];
        services.forEach((s: any) => {
          custoReal += Number(realCosts[s.id] ?? s.productionCost ?? 0);
        });
        custoReal += nfCost;
      });

      return {
        month: label,
        faturamento,
        custoReal,
        margem: faturamento - custoReal,
        meta: goals[key] || 0,
      };
    });
  }, [budgets, versions, goals, selectedYear]);

  const annualTotals = useMemo(() => {
    return annualData.reduce(
      (acc, d) => ({
        faturamento: acc.faturamento + d.faturamento,
        custoReal: acc.custoReal + d.custoReal,
        margem: acc.margem + d.margem,
        meta: acc.meta + d.meta,
      }),
      { faturamento: 0, custoReal: 0, margem: 0, meta: 0 }
    );
  }, [annualData]);

  // Account CRUD
  async function saveAccount() {
    const wid = workspace!.id;
    if (!accountForm.name.trim()) { toast.error('Nome da conta é obrigatório'); return; }

    if (editingAccount) {
      const { error } = await supabase.from('financial_accounts').update({
        name: accountForm.name, type: accountForm.type, bank: accountForm.bank,
        agency: accountForm.agency, account_number: accountForm.account_number,
      }).eq('id', editingAccount.id);
      if (error) { toast.error('Erro ao atualizar conta'); return; }
      toast.success('Conta atualizada');
    } else {
      const { error } = await supabase.from('financial_accounts').insert({
        workspace_id: wid, name: accountForm.name, type: accountForm.type,
        bank: accountForm.bank, agency: accountForm.agency, account_number: accountForm.account_number,
      });
      if (error) { toast.error('Erro ao criar conta'); return; }
      toast.success('Conta criada');
    }
    setAccountDialog(false);
    setEditingAccount(null);
    setAccountForm({ name: '', type: 'corrente', bank: '', agency: '', account_number: '' });
    loadData();
  }

  async function deleteAccount(id: string) {
    if (!confirm('Excluir esta conta?')) return;
    await supabase.from('financial_accounts').delete().eq('id', id);
    toast.success('Conta excluída');
    loadData();
  }

  function openEditAccount(acc: FinancialAccount) {
    setEditingAccount(acc);
    setAccountForm({ name: acc.name, type: acc.type, bank: acc.bank, agency: acc.agency, account_number: acc.account_number });
    setAccountDialog(true);
  }

  function openNewAccount() {
    setEditingAccount(null);
    setAccountForm({ name: '', type: 'corrente', bank: '', agency: '', account_number: '' });
    setAccountDialog(true);
  }

  // Month options
  const monthOptions = useMemo(() => {
    const months: string[] = [];
    for (let i = -6; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(format(d, 'yyyy-MM'));
    }
    return months;
  }, []);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <Tabs defaultValue="projetos">
        <TabsList>
          <TabsTrigger value="projetos">Projetos do Mês</TabsTrigger>
          <TabsTrigger value="anual">Painel Anual</TabsTrigger>
          <TabsTrigger value="contas">Contas Financeiras</TabsTrigger>
        </TabsList>

        {/* PROJETOS DO MÊS */}
        <TabsContent value="projetos" className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(new Date(m + '-01'), 'MMMM yyyy', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" /> Faturamento
                </div>
                <p className="text-xl font-bold">{currencyFmt(monthlyProjects.reduce((s, p) => s + p.totalValue, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingDown className="w-4 h-4" /> Custo Real
                </div>
                <p className="text-xl font-bold">{currencyFmt(monthlyProjects.reduce((s, p) => s + p.totalRealCost, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" /> Imposto NF
                </div>
                <p className="text-xl font-bold">{currencyFmt(monthlyProjects.reduce((s, p) => s + p.nfCost, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" /> Margem Real
                </div>
                <p className="text-xl font-bold">{currencyFmt(monthlyProjects.reduce((s, p) => s + p.margin, 0))}</p>
              </CardContent>
            </Card>
          </div>

          {monthlyProjects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum projeto aprovado para este mês.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposta</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviços</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Custo Real</TableHead>
                      <TableHead className="text-right">NF</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyProjects.map(p => (
                      <React.Fragment key={p.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                        >
                          <TableCell className="font-mono text-sm">{p.proposalId}</TableCell>
                          <TableCell className="font-medium">{p.projectName}</TableCell>
                          <TableCell>{p.clientName}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {p.services.map((s, i) => (
                                <div key={i} className="text-xs">
                                  {s.name}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{currencyFmt(p.totalValue)}</TableCell>
                          <TableCell className="text-right">{currencyFmt(p.totalRealCost)}</TableCell>
                          <TableCell className="text-right">{currencyFmt(p.nfCost)}</TableCell>
                          <TableCell className="text-right">
                            <span className={p.margin >= 0 ? 'text-green-600' : 'text-destructive'}>
                              {currencyFmt(p.margin)} ({p.marginPercent.toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); navigate(`/crm/orcamento/${p.id}`); }}
                              title="Ver no CRM"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail */}
                        {expandedProject === p.id && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/30 p-0">
                              <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold">Composição do Investimento</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Serviço</TableHead>
                                      <TableHead className="text-right">Valor Proposta</TableHead>
                                      <TableHead className="text-right">Custo Real</TableHead>
                                      <TableHead className="text-right">Margem</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {p.services.map((s, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell className="text-right">{currencyFmt(s.value)}</TableCell>
                                        <TableCell className="text-right">{currencyFmt(s.realCost)}</TableCell>
                                        <TableCell className="text-right">
                                          <span className={s.margin >= 0 ? 'text-green-600' : 'text-destructive'}>
                                            {currencyFmt(s.margin)} ({s.marginPercent.toFixed(1)}%)
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* NF row */}
                                    <TableRow>
                                      <TableCell className="font-medium">Imposto NF</TableCell>
                                      <TableCell className="text-right">—</TableCell>
                                      <TableCell className="text-right">{currencyFmt(p.nfCost)}</TableCell>
                                      <TableCell className="text-right">—</TableCell>
                                    </TableRow>
                                    {/* Total row */}
                                    <TableRow className="font-bold border-t-2">
                                      <TableCell>Total</TableCell>
                                      <TableCell className="text-right">{currencyFmt(p.totalValue)}</TableCell>
                                      <TableCell className="text-right">{currencyFmt(p.totalRealCost + p.nfCost)}</TableCell>
                                      <TableCell className="text-right">
                                        <span className={p.margin >= 0 ? 'text-green-600' : 'text-destructive'}>
                                          {currencyFmt(p.margin)} ({p.marginPercent.toFixed(1)}%)
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PAINEL ANUAL */}
        <TabsContent value="anual" className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Ano</Label>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Annual summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Faturamento Anual</p>
                <p className="text-xl font-bold">{currencyFmt(annualTotals.faturamento)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Custo Real Anual</p>
                <p className="text-xl font-bold">{currencyFmt(annualTotals.custoReal)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Margem Real Anual</p>
                <p className="text-xl font-bold text-green-600">{currencyFmt(annualTotals.margem)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Meta Anual</p>
                <p className="text-xl font-bold">{currencyFmt(annualTotals.meta)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faturamento vs Custo vs Margem</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={annualData}>
                  <CartesianAxis />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currencyFmt(v)} />
                  <Legend />
                  <Bar dataKey="faturamento" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custoReal" name="Custo Real" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margem" name="Margem" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta vs Realizado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualData}>
                  <CartesianAxis />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => currencyFmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="faturamento" name="Realizado" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTAS FINANCEIRAS */}
        <TabsContent value="contas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Contas Financeiras</h2>
            <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
              <DialogTrigger asChild>
                <Button onClick={openNewAccount} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Conta</Label>
                    <Input value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Banco do Brasil" />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={accountForm.type} onValueChange={v => setAccountForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Banco</Label>
                    <Input value={accountForm.bank} onChange={e => setAccountForm(f => ({ ...f, bank: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Agência</Label>
                      <Input value={accountForm.agency} onChange={e => setAccountForm(f => ({ ...f, agency: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Número da Conta</Label>
                      <Input value={accountForm.account_number} onChange={e => setAccountForm(f => ({ ...f, account_number: e.target.value }))} />
                    </div>
                  </div>
                  <Button onClick={saveAccount} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {accounts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Landmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
                Nenhuma conta cadastrada.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Agência</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map(acc => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.name}</TableCell>
                        <TableCell>{ACCOUNT_TYPES.find(t => t.value === acc.type)?.label || acc.type}</TableCell>
                        <TableCell>{acc.bank || '—'}</TableCell>
                        <TableCell>{acc.agency || '—'}</TableCell>
                        <TableCell>{acc.account_number || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={acc.is_active ? 'default' : 'secondary'}>
                            {acc.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditAccount(acc)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAccount(acc.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
