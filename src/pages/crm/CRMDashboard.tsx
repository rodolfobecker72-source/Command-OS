import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/types/crm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, FileText, CheckCircle2, DollarSign, AlertTriangle, Calendar, Search } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[Number(m) - 1]}/${y}`;
}

export function CRMDashboard() {
  const { budgets, clients, kanbanColumns } = useCRM();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const clientMap = useMemo(() => {
    const map: Record<string, typeof clients[0]> = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    return budgets.filter(b => {
      if (dateFrom && new Date(b.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(b.createdAt) > to) return false;
      }
      if (clientSearch) {
        const q = clientSearch.toLowerCase();
        const client = clientMap[b.clientId];
        const name = client?.companyName?.toLowerCase() || '';
        const projName = b.projectName?.toLowerCase() || '';
        if (!name.includes(q) && !projName.includes(q)) return false;
      }
      return true;
    });
  }, [budgets, dateFrom, dateTo, clientSearch, clientMap]);

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

  // Follow-up needed
  const followUps = useMemo(() => {
    const now = new Date();
    return filtered
      .filter(b => b.status === 'proposta_enviada' || b.status === 'fazer_followup')
      .map(b => {
        const client = clientMap[b.clientId];
        const daysSince = Math.floor((now.getTime() - new Date(b.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        return { id: b.id, proposalId: b.proposalId, projectName: b.projectName, clientName: client?.companyName || '—', daysSince, status: b.status };
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

  // Sales by month
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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard Comercial</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Visão geral do desempenho comercial</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end">
        <div className="flex gap-2 flex-1">
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">De</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm sm:w-40" />
          </div>
          <div className="space-y-1 flex-1 sm:flex-none">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Até</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm sm:w-40" />
          </div>
        </div>
        <div className="space-y-1 flex-1 sm:max-w-xs">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Cliente ou projeto..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="h-9 text-sm pl-8" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={FileText} iconBg="bg-primary/10" iconColor="text-primary" label="Total Propostas" value={String(totalProposals)} />
        <KPICard icon={CheckCircle2} iconBg="bg-success/10" iconColor="text-success" label="Aprovadas" value={String(approvedCount)} />
        <KPICard icon={TrendingUp} iconBg="bg-accent/10" iconColor="text-accent" label="Conversão" value={`${conversionRate}%`} />
        <KPICard icon={DollarSign} iconBg="bg-warning/10" iconColor="text-warning" label="Valor Vendido" value={formatCurrency(totalValueSold)} small />
      </div>

      {/* Pipeline + Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Propostas" radius={[0, 4, 4, 0]} barSize={20}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Vendas por Mês</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {salesByMonth.length === 0 ? (
              <p className="text-xs text-muted-foreground py-16 text-center">Nenhuma venda no período</p>
            ) : (
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByMonth} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up + Execution Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              Follow-up Necessário
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {followUps.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">Nenhuma proposta pendente</p>
            ) : (
              <div className="max-h-64 overflow-auto -mx-1 px-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Projeto</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs text-right">Dias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs font-medium py-2 max-w-[180px] truncate">
                          {f.proposalId} - {f.projectName}
                        </TableCell>
                        <TableCell className="text-xs py-2">{f.clientName}</TableCell>
                        <TableCell className="text-right py-2">
                          <Badge variant={f.daysSince > 7 ? 'destructive' : f.daysSince > 3 ? 'secondary' : 'outline'} className="text-[10px] px-1.5">
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

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Previsão de Execução
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {executionForecast.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">Nenhum projeto com mês de execução</p>
            ) : (
              <div className="max-h-64 overflow-auto -mx-1 px-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Mês</TableHead>
                      <TableHead className="text-xs text-center">Projetos</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionForecast.map(f => (
                      <TableRow key={f.month}>
                        <TableCell className="text-xs font-medium py-2">{f.label}</TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="outline" className="text-[10px] px-1.5">{f.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium py-2">{formatCurrency(f.value)}</TableCell>
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

function KPICard({ icon: Icon, iconBg, iconColor, label, value, small }: {
  icon: typeof FileText; iconBg: string; iconColor: string; label: string; value: string; small?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className={`font-bold text-foreground truncate ${small ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
