import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/types/crm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, FileText, CheckCircle2, DollarSign, AlertTriangle, Calendar } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[Number(m) - 1]}/${y}`;
}

export function CRMDashboard() {
  const { budgets, clients, kanbanColumns } = useCRM();

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');

  // Derive unique responsibles from budgets (using client responsiblePerson)
  const clientMap = useMemo(() => {
    const map: Record<string, typeof clients[0]> = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const responsibles = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => { if (c.responsiblePerson) set.add(c.responsiblePerson); });
    return Array.from(set).sort();
  }, [clients]);

  // Filtered budgets
  const filtered = useMemo(() => {
    return budgets.filter(b => {
      // Date range
      if (dateFrom && new Date(b.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(b.createdAt) > to) return false;
      }
      // Responsible
      const client = clientMap[b.clientId];
      if (responsibleFilter !== 'all' && client?.responsiblePerson !== responsibleFilter) return false;
      // Client search
      if (clientSearch) {
        const q = clientSearch.toLowerCase();
        const name = client?.companyName?.toLowerCase() || '';
        const projName = b.projectName?.toLowerCase() || '';
        if (!name.includes(q) && !projName.includes(q)) return false;
      }
      return true;
    });
  }, [budgets, dateFrom, dateTo, responsibleFilter, clientSearch, clientMap]);

  // KPIs
  const totalProposals = filtered.length;
  const approved = filtered.filter(b => b.status === 'aprovada');
  const approvedCount = approved.length;
  const conversionRate = totalProposals > 0 ? ((approvedCount / totalProposals) * 100).toFixed(1) : '0';
  const totalValueSold = approved.reduce((sum, b) => sum + (b.finalValue || 0), 0);

  // Pipeline
  const sortedColumns = useMemo(() => [...kanbanColumns].sort((a, b) => a.order - b.order), [kanbanColumns]);
  const pipelineData = useMemo(() => {
    return sortedColumns.map(col => ({
      name: col.label,
      count: filtered.filter(b => b.status === col.key).length,
      color: col.key === 'aprovada' ? 'hsl(var(--success))' : col.key === 'nao_aprovada' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
    }));
  }, [filtered, sortedColumns]);

  // Follow-up needed (proposta_enviada or fazer_followup)
  const followUps = useMemo(() => {
    const now = new Date();
    return filtered
      .filter(b => b.status === 'proposta_enviada' || b.status === 'fazer_followup')
      .map(b => {
        const client = clientMap[b.clientId];
        const daysSince = Math.floor((now.getTime() - new Date(b.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: b.id,
          proposalId: b.proposalId,
          projectName: b.projectName,
          clientName: client?.companyName || '—',
          daysSince,
          status: b.status,
        };
      })
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [filtered, clientMap]);

  // Execution forecast
  const executionForecast = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    approved.forEach(b => {
      const month = b.executionMonth;
      if (!month) return;
      if (!map[month]) map[month] = { count: 0, value: 0 };
      map[month].count++;
      map[month].value += b.finalValue || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, label: formatMonthLabel(month), ...data }));
  }, [approved]);

  // Sales by month (approval date month)
  const salesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    approved.forEach(b => {
      if (!b.approvalDate) return;
      const d = new Date(b.approvalDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (b.finalValue || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, label: formatMonthLabel(month), value }));
  }, [approved]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Comercial</h1>
        <p className="text-muted-foreground text-sm">Visão geral do desempenho comercial</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">De</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Até</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {responsibles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Buscar cliente / projeto</label>
              <Input placeholder="Buscar..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Propostas</p>
              <p className="text-2xl font-bold text-foreground">{totalProposals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Aprovadas</p>
              <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Valor Vendido</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValueSold)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline + Sales by Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Propostas" radius={[0, 4, 4, 0]}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vendas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma venda aprovada no período</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByMonth} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up + Execution Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Follow-up Needed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Follow-up Necessário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma proposta pendente de follow-up</p>
            ) : (
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Dias s/ contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-sm">
                          {f.proposalId} - {f.projectName}
                        </TableCell>
                        <TableCell className="text-sm">{f.clientName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={f.daysSince > 7 ? 'destructive' : f.daysSince > 3 ? 'secondary' : 'outline'} className="text-xs">
                            {f.daysSince}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Forecast */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Previsão de Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            {executionForecast.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum projeto aprovado com mês de execução</p>
            ) : (
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-center">Projetos</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionForecast.map(f => (
                      <TableRow key={f.month}>
                        <TableCell className="font-medium text-sm">{f.label}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{f.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(f.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
