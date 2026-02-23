import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Plus, Filter, LayoutGrid, List, Users, PhoneCall,
  CalendarCheck, FileText, XCircle, DollarSign, Target, Flame,
  ThermometerSun, ArrowUpRight, RotateCcw, Trash2, Edit, Eye,
  ChevronDown, Building2, User, Phone, Mail, MapPin, Briefcase,
  Clock, Flag, MessageSquare, X, Save, BarChart3, AlertTriangle,
  TrendingUp, Activity, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useProspection } from '@/contexts/ProspectionContext';
import { useCRM } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProspectionLead, LeadOriginType, LeadSegment, LeadTemperature,
  LeadFunnelStatus, LeadPriority, AcquisitionType,
  LEAD_ORIGIN_LABELS, LEAD_SEGMENT_LABELS, LEAD_TEMPERATURE_LABELS,
  LEAD_FUNNEL_STATUS_LABELS, LEAD_PRIORITY_LABELS, ACQUISITION_TYPE_LABELS,
  FUNNEL_STATUS_ORDER,
} from '@/types/prospection';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function TemperatureBadge({ temp }: { temp: LeadTemperature }) {
  const styles: Record<LeadTemperature, string> = {
    frio: 'bg-muted text-muted-foreground',
    morno: 'bg-warning/15 text-warning border-warning/20',
    quente: 'bg-success/15 text-success border-success/20',
  };
  return (
    <Badge variant="outline" className={`${styles[temp]} text-xs gap-1`}>
      <ThermometerSun className="w-3 h-3" />
      {LEAD_TEMPERATURE_LABELS[temp]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: LeadPriority }) {
  const styles: Record<LeadPriority, string> = {
    alta: 'bg-destructive/15 text-destructive border-destructive/20',
    media: 'bg-warning/15 text-warning border-warning/20',
    baixa: 'bg-muted text-muted-foreground',
  };
  return (
    <Badge variant="outline" className={`${styles[priority]} text-xs gap-1`}>
      <Flag className="w-3 h-3" />
      {LEAD_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

function FunnelStatusBadge({ status }: { status: LeadFunnelStatus }) {
  const colorMap: Record<LeadFunnelStatus, string> = {
    mapeado: 'bg-muted text-muted-foreground',
    tentativa_contato: 'bg-info/15 text-info border-info/20',
    contato_realizado: 'bg-primary/10 text-primary border-primary/20',
    reuniao_agendada: 'bg-warning/15 text-warning border-warning/20',
    reuniao_realizada: 'bg-warning/20 text-warning border-warning/30',
    proposta_solicitada: 'bg-success/10 text-success border-success/20',
    qualificado_crm: 'bg-success/20 text-success border-success/30',
    perdido: 'bg-destructive/15 text-destructive border-destructive/20',
    nutricao: 'bg-primary/5 text-muted-foreground border-primary/10',
  };
  return (
    <Badge variant="outline" className={`${colorMap[status]} text-xs`}>
      {LEAD_FUNNEL_STATUS_LABELS[status]}
    </Badge>
  );
}

const emptyLead: Omit<ProspectionLead, 'id' | 'createdAt' | 'updatedAt'> = {
  companyName: '',
  contactName: '',
  contactRole: '',
  phone: '',
  email: '',
  city: '',
  origin: 'prospeccao_ativa',
  segment: 'tecnologia',
  acquisitionType: 'outbound',
  estimatedPotential: 0,
  temperature: 'frio',
  funnelStatus: 'mapeado',
  prospectionResponsible: '',
  closingResponsible: '',
  lastContactDate: '',
  nextAction: '',
  nextActionDate: '',
  priority: 'media',
  strategicNotes: '',
};

export function ProspectionPage() {
  const { leads, addLead, updateLead, deleteLead, reactivateLead } = useProspection();
  const { addClient } = useCRM();
  const auth = useAuth();

  const [activeTab, setActiveTab] = useState<'leads' | 'painel'>('leads');
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterAcquisition, setFilterAcquisition] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<ProspectionLead | null>(null);
  const [formData, setFormData] = useState(emptyLead);
  const [detailLead, setDetailLead] = useState<ProspectionLead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Available years
  const years = useMemo(() => {
    const y = new Set(leads.map(l => new Date(l.createdAt).getFullYear()));
    y.add(new Date().getFullYear());
    return Array.from(y).sort((a, b) => b - a);
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const d = new Date(lead.createdAt);
      if (filterYear !== 'all' && d.getFullYear() !== Number(filterYear)) return false;
      if (filterMonth !== 'all' && d.getMonth() !== Number(filterMonth)) return false;
      if (filterOrigin !== 'all' && lead.origin !== filterOrigin) return false;
      if (filterResponsible !== 'all' && lead.prospectionResponsible !== filterResponsible) return false;
      if (filterAcquisition !== 'all' && lead.acquisitionType !== filterAcquisition) return false;
      if (search) {
        const q = search.toLowerCase();
        return lead.companyName.toLowerCase().includes(q)
          || lead.contactName.toLowerCase().includes(q)
          || lead.city.toLowerCase().includes(q);
      }
      return true;
    });
  }, [leads, filterYear, filterMonth, filterOrigin, filterResponsible, filterAcquisition, search]);

  // Metrics
  const metrics = useMemo(() => {
    const total = filteredLeads.length;
    const active = filteredLeads.filter(l => !['perdido', 'qualificado_crm'].includes(l.funnelStatus)).length;
    const meetings = filteredLeads.filter(l => ['reuniao_agendada', 'reuniao_realizada'].includes(l.funnelStatus)).length;
    const proposals = filteredLeads.filter(l => l.funnelStatus === 'proposta_solicitada').length;
    const lost = filteredLeads.filter(l => l.funnelStatus === 'perdido').length;
    const volume = filteredLeads.reduce((sum, l) => sum + (l.estimatedPotential || 0), 0);

    const mapped = filteredLeads.filter(l => l.funnelStatus === 'mapeado').length;
    const meetingsTotal = meetings;
    const qualifiedCRM = filteredLeads.filter(l => l.funnelStatus === 'qualificado_crm').length;

    const convMappedToMeeting = total > 0 ? ((meetingsTotal / Math.max(mapped + meetingsTotal, 1)) * 100) : 0;
    const convMeetingToCRM = meetingsTotal > 0 ? ((qualifiedCRM / Math.max(meetingsTotal + qualifiedCRM, 1)) * 100) : 0;
    const lossRate = total > 0 ? ((lost / total) * 100) : 0;

    return { total, active, meetings, proposals, lost, volume, convMappedToMeeting, convMeetingToCRM, lossRate };
  }, [filteredLeads]);

  const dashboardCards = [
    { label: 'Total Leads', value: metrics.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Leads Ativos', value: metrics.active, icon: Target, color: 'bg-success/10 text-success' },
    { label: 'Reuniões Agendadas', value: metrics.meetings, icon: CalendarCheck, color: 'bg-warning/10 text-warning' },
    { label: 'Propostas Geradas', value: metrics.proposals, icon: FileText, color: 'bg-info/10 text-info' },
    { label: 'Leads Perdidos', value: metrics.lost, icon: XCircle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Volume Estimado', value: `R$ ${metrics.volume.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-primary/10 text-primary' },
  ];

  // Open create dialog
  const openCreate = () => {
    setEditingLead(null);
    setFormData(emptyLead);
    setDialogOpen(true);
  };

  const openEdit = (lead: ProspectionLead) => {
    setEditingLead(lead);
    setFormData({
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactRole: lead.contactRole,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      origin: lead.origin,
      segment: lead.segment,
      acquisitionType: lead.acquisitionType,
      estimatedPotential: lead.estimatedPotential,
      temperature: lead.temperature,
      funnelStatus: lead.funnelStatus,
      prospectionResponsible: lead.prospectionResponsible,
      closingResponsible: lead.closingResponsible,
      lastContactDate: lead.lastContactDate,
      nextAction: lead.nextAction,
      nextActionDate: lead.nextActionDate,
      priority: lead.priority,
      strategicNotes: lead.strategicNotes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.companyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    if (editingLead) {
      updateLead(editingLead.id, formData);
      toast.success('Lead atualizado!');
    } else {
      addLead(formData);
      toast.success('Lead criado!');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteLead(id);
    setDeleteConfirm(null);
    toast.success('Lead excluído');
  };

  const mapOriginToCRM = (origin: LeadOriginType): import('@/types/crm').LeadOrigin => {
    const map: Record<LeadOriginType, import('@/types/crm').LeadOrigin> = {
      prospeccao_ativa: 'prospeccao_ativa',
      indicacao: 'indicacao',
      instagram: 'organico',
      meta_ads: 'trafego_pago',
      google_ads: 'google',
      evento: 'evento_feira',
      networking: 'parceria',
      site: 'site',
      outro: 'organico',
    };
    return map[origin];
  };

  const handleMigrateToCRM = (lead: ProspectionLead) => {
    const newClient = addClient({
      companyName: lead.companyName,
      cnpj: '',
      responsiblePerson: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      leadOrigin: mapOriginToCRM(lead.origin),
      score: 0,
    });
    updateLead(lead.id, { funnelStatus: 'qualificado_crm' });
    toast.success(`"${lead.companyName}" migrado para o CRM como cliente!`);
  };

  const handleReactivate = (lead: ProspectionLead) => {
    reactivateLead(lead.id);
    toast.success(`"${lead.companyName}" reativado!`);
  };

  // Kanban columns (filter out perdido and nutricao — they show separately)
  const kanbanStatuses: LeadFunnelStatus[] = [
    'mapeado', 'tentativa_contato', 'contato_realizado',
    'reuniao_agendada', 'reuniao_realizada', 'proposta_solicitada', 'qualificado_crm',
  ];

  const uniqueResponsibles = useMemo(() => {
    const names = new Set(leads.map(l => l.prospectionResponsible).filter(Boolean));
    return Array.from(names);
  }, [leads]);

  // Dashboard panel data
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const scheduledActivities = useMemo(() => {
    return filteredLeads
      .filter(l => l.nextActionDate && !['perdido', 'qualificado_crm'].includes(l.funnelStatus))
      .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));
  }, [filteredLeads]);

  const overdueActivities = useMemo(() => {
    return scheduledActivities.filter(l => l.nextActionDate < todayStr);
  }, [scheduledActivities, todayStr]);

  const todayActivities = useMemo(() => {
    return scheduledActivities.filter(l => l.nextActionDate === todayStr);
  }, [scheduledActivities, todayStr]);

  const upcomingActivities = useMemo(() => {
    return scheduledActivities.filter(l => l.nextActionDate > todayStr);
  }, [scheduledActivities, todayStr]);

  const panelMetrics = useMemo(() => {
    const fl = filteredLeads;
    const total = fl.length;
    const byOrigin = Object.entries(LEAD_ORIGIN_LABELS).map(([k, v]) => ({
      key: k, label: v, count: fl.filter(l => l.origin === k).length,
    })).filter(o => o.count > 0).sort((a, b) => b.count - a.count);

    const bySegment = Object.entries(LEAD_SEGMENT_LABELS).map(([k, v]) => ({
      key: k, label: v, count: fl.filter(l => l.segment === k).length,
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

    const byTemperature = {
      quente: fl.filter(l => l.temperature === 'quente').length,
      morno: fl.filter(l => l.temperature === 'morno').length,
      frio: fl.filter(l => l.temperature === 'frio').length,
    };

    const outbound = fl.filter(l => l.acquisitionType === 'outbound').length;
    const inbound = fl.filter(l => l.acquisitionType === 'inbound').length;

    const avgPotential = total > 0 ? fl.reduce((s, l) => s + (l.estimatedPotential || 0), 0) / total : 0;

    const highPriority = fl.filter(l => l.priority === 'alta' && !['perdido', 'qualificado_crm'].includes(l.funnelStatus)).length;

    const withoutAction = fl.filter(l => !l.nextActionDate && !['perdido', 'qualificado_crm'].includes(l.funnelStatus)).length;

    return { total, byOrigin, bySegment, byTemperature, outbound, inbound, avgPotential, highPriority, withoutAction };
  }, [filteredLeads]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospecção</h1>
          <p className="text-muted-foreground text-sm mt-1">Módulo pré-CRM de aquisição e qualificação de leads</p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2 rounded-xl shadow-sm">
          <Plus className="w-4 h-4" /> Novo Lead
        </Button>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'leads' ? 'default' : 'outline'}
          className="gap-2 rounded-xl"
          onClick={() => setActiveTab('leads')}
        >
          <Users className="w-4 h-4" /> Leads
        </Button>
        <Button
          variant={activeTab === 'painel' ? 'default' : 'outline'}
          className="gap-2 rounded-xl"
          onClick={() => setActiveTab('painel')}
        >
          <BarChart3 className="w-4 h-4" /> Painel de Controle
        </Button>
      </div>

      {activeTab === 'leads' && (
        <>
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar empresa, contato ou cidade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
                    </div>
                  </div>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[100px] h-10 rounded-xl"><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl"><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                    <SelectTrigger className="w-[150px] h-10 rounded-xl"><SelectValue placeholder="Origem" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas origens</SelectItem>
                      {Object.entries(LEAD_ORIGIN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterAcquisition} onValueChange={setFilterAcquisition}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                  {uniqueResponsibles.length > 0 && (
                    <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                      <SelectTrigger className="w-[150px] h-10 rounded-xl"><SelectValue placeholder="Responsável" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueResponsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex gap-1 ml-auto">
                    <Button variant={view === 'table' ? 'default' : 'outline'} size="icon" className="rounded-xl" onClick={() => setView('table')}>
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant={view === 'kanban' ? 'default' : 'outline'} size="icon" className="rounded-xl" onClick={() => setView('kanban')}>
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Temperatura</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Potencial</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Próxima Ação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">Nenhum lead encontrado</p>
                          <p className="text-sm">Crie seu primeiro lead para começar</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredLeads.map(lead => (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailLead(lead)}>
                        <TableCell>
                          <div className="font-medium">{lead.companyName}</div>
                          <div className="text-xs text-muted-foreground">{lead.city}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{lead.contactName}</div>
                          <div className="text-xs text-muted-foreground">{lead.contactRole}</div>
                        </TableCell>
                        <TableCell><span className="text-xs">{LEAD_ORIGIN_LABELS[lead.origin]}</span></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ACQUISITION_TYPE_LABELS[lead.acquisitionType]}
                          </Badge>
                        </TableCell>
                        <TableCell><TemperatureBadge temp={lead.temperature} /></TableCell>
                        <TableCell><FunnelStatusBadge status={lead.funnelStatus} /></TableCell>
                        <TableCell className="font-medium">
                          {lead.estimatedPotential > 0
                            ? `R$ ${lead.estimatedPotential.toLocaleString('pt-BR')}`
                            : '-'}
                        </TableCell>
                        <TableCell><PriorityBadge priority={lead.priority} /></TableCell>
                        <TableCell>
                          <div className="text-xs">{lead.nextAction || '-'}</div>
                          {lead.nextActionDate && (
                            <div className="text-xs text-muted-foreground">{format(new Date(lead.nextActionDate), 'dd/MM/yyyy')}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            {lead.funnelStatus === 'qualificado_crm' && (
                              <Button size="sm" variant="default" className="gap-1 text-xs h-7" onClick={() => handleMigrateToCRM(lead)}>
                                <ArrowUpRight className="w-3 h-3" /> CRM
                              </Button>
                            )}
                            {lead.funnelStatus === 'perdido' && (
                              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => handleReactivate(lead)}>
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(lead)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(lead.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {kanbanStatuses.map(status => {
                const statusLeads = filteredLeads.filter(l => l.funnelStatus === status);
                return (
                  <div key={status} className="min-w-[280px] flex-shrink-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <FunnelStatusBadge status={status} />
                        <span className="text-xs font-medium text-muted-foreground">{statusLeads.length}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {statusLeads.map(lead => (
                        <Card key={lead.id} className="border-0 shadow-sm rounded-2xl cursor-pointer hover:shadow-md transition-all"
                          onClick={() => setDetailLead(lead)}>
                          <CardContent className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{lead.companyName}</p>
                                <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                              </div>
                              <TemperatureBadge temp={lead.temperature} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{LEAD_ORIGIN_LABELS[lead.origin]}</Badge>
                              <PriorityBadge priority={lead.priority} />
                            </div>
                            {lead.estimatedPotential > 0 && (
                              <p className="text-xs font-semibold">R$ {lead.estimatedPotential.toLocaleString('pt-BR')}</p>
                            )}
                            {lead.nextAction && (
                              <p className="text-xs text-muted-foreground truncate">
                                <Clock className="w-3 h-3 inline mr-1" />{lead.nextAction}
                              </p>
                            )}
                            {status === 'qualificado_crm' && (
                              <Button size="sm" className="w-full gap-1 text-xs h-7 mt-1" onClick={e => { e.stopPropagation(); handleMigrateToCRM(lead); }}>
                                <ArrowUpRight className="w-3 h-3" /> Migrar para CRM
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {statusLeads.length === 0 && (
                        <div className="border border-dashed rounded-2xl p-6 text-center text-xs text-muted-foreground">
                          Nenhum lead
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Perdidos & Nutrição */}
            {filteredLeads.some(l => l.funnelStatus === 'perdido' || l.funnelStatus === 'nutricao') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                {['perdido', 'nutricao'].map(status => {
                  const items = filteredLeads.filter(l => l.funnelStatus === status);
                  if (items.length === 0) return null;
                  return (
                    <Card key={status} className="border-0 shadow-sm rounded-2xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FunnelStatusBadge status={status as LeadFunnelStatus} />
                          <span className="text-muted-foreground">({items.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {items.map(lead => (
                          <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div>
                              <p className="text-sm font-medium">{lead.companyName}</p>
                              <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                                onClick={() => handleReactivate(lead)}>
                                <RotateCcw className="w-3 h-3" /> Reativar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* Painel de Controle */}
      {activeTab === 'painel' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Period Filters for Panel */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Período:</span>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[100px] h-10 rounded-xl"><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Leads', value: metrics.total, icon: Users, color: 'bg-primary/10 text-primary' },
              { label: 'Leads Ativos', value: metrics.active, icon: Target, color: 'bg-success/10 text-success' },
              { label: 'Reuniões', value: metrics.meetings, icon: CalendarCheck, color: 'bg-warning/10 text-warning' },
              { label: 'Propostas', value: metrics.proposals, icon: FileText, color: 'bg-info/10 text-info' },
              { label: 'Perdidos', value: metrics.lost, icon: XCircle, color: 'bg-destructive/10 text-destructive' },
              { label: 'Volume (R$)', value: `R$ ${metrics.volume.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-primary/10 text-primary' },
            ].map((card) => (
              <Card key={card.label} className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${card.color}`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-lg font-bold">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conversion Rates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mapeado → Reunião</p>
                  <p className="text-2xl font-bold">{metrics.convMappedToMeeting.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reunião → CRM</p>
                  <p className="text-2xl font-bold">{metrics.convMeetingToCRM.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de Perda</p>
                  <p className="text-2xl font-bold">{metrics.lossRate.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Extra Insights Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Ticket Médio Estimado</p>
                <p className="text-lg font-bold">R$ {panelMetrics.avgPotential.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Outbound / Inbound</p>
                <p className="text-lg font-bold">{panelMetrics.outbound} / {panelMetrics.inbound}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Prioridade Alta</p>
                <p className="text-lg font-bold text-destructive">{panelMetrics.highPriority}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Sem Ação Definida</p>
                <p className="text-lg font-bold text-warning">{panelMetrics.withoutAction}</p>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overdue */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Atrasadas
                  <Badge variant="destructive" className="ml-auto text-xs">{overdueActivities.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {overdueActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade atrasada 🎉</p>
                ) : overdueActivities.map(lead => (
                  <div key={lead.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={() => setDetailLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                      </div>
                      <TemperatureBadge temp={lead.temperature} />
                    </div>
                    <p className="text-xs mt-1.5 text-foreground/80">
                      <Clock className="w-3 h-3 inline mr-1" />{lead.nextAction}
                    </p>
                    <p className="text-xs text-destructive font-medium mt-1">
                      {format(new Date(lead.nextActionDate + 'T12:00:00'), 'dd/MM/yyyy')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Hoje
                  <Badge className="ml-auto text-xs">{todayActivities.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {todayActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade para hoje</p>
                ) : todayActivities.map(lead => (
                  <div key={lead.id} className="p-3 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setDetailLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                      </div>
                      <TemperatureBadge temp={lead.temperature} />
                    </div>
                    <p className="text-xs mt-1.5 text-foreground/80">
                      <Clock className="w-3 h-3 inline mr-1" />{lead.nextAction}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-success" />
                  Próximas
                  <Badge variant="outline" className="ml-auto text-xs">{upcomingActivities.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                {upcomingActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade futura agendada</p>
                ) : upcomingActivities.slice(0, 10).map(lead => (
                  <div key={lead.id} className="p-3 rounded-xl bg-success/5 border border-success/10 cursor-pointer hover:bg-success/10 transition-colors"
                    onClick={() => setDetailLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                      </div>
                      <TemperatureBadge temp={lead.temperature} />
                    </div>
                    <p className="text-xs mt-1.5 text-foreground/80">
                      <Clock className="w-3 h-3 inline mr-1" />{lead.nextAction}
                    </p>
                    <p className="text-xs text-success font-medium mt-1">
                      {format(new Date(lead.nextActionDate + 'T12:00:00'), 'dd/MM/yyyy')}
                    </p>
                  </div>
                ))}
                {upcomingActivities.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">+{upcomingActivities.length - 10} mais</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Temperature */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4" /> Temperatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Quente', value: panelMetrics.byTemperature.quente, color: 'bg-success', total: panelMetrics.total },
                  { label: 'Morno', value: panelMetrics.byTemperature.morno, color: 'bg-warning', total: panelMetrics.total },
                  { label: 'Frio', value: panelMetrics.byTemperature.frio, color: 'bg-muted-foreground', total: panelMetrics.total },
                ].map(t => (
                  <div key={t.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{t.label}</span>
                      <span className="font-medium">{t.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${t.color} rounded-full transition-all`}
                        style={{ width: `${t.total > 0 ? (t.value / t.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* By Origin */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                {panelMetrics.byOrigin.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                ) : panelMetrics.byOrigin.map(o => (
                  <div key={o.key} className="flex items-center justify-between text-sm">
                    <span className="text-xs">{o.label}</span>
                    <Badge variant="outline" className="text-xs">{o.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* By Segment */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Segmento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                {panelMetrics.bySegment.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                ) : panelMetrics.bySegment.map(s => (
                  <div key={s.key} className="flex items-center justify-between text-sm">
                    <span className="text-xs">{s.label}</span>
                    <Badge variant="outline" className="text-xs">{s.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>Preencha as informações do lead</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-3 md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Informações Básicas
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Empresa *</Label>
              <Input value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Contato</Label>
              <Input value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={formData.contactRole} onChange={e => setFormData(p => ({ ...p, contactRole: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
            </div>

            {/* Classification */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Classificação
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Origem *</Label>
              <Select value={formData.origin} onValueChange={(v: LeadOriginType) => setFormData(p => ({ ...p, origin: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_ORIGIN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Segmento</Label>
              <Select value={formData.segment} onValueChange={(v: LeadSegment) => setFormData(p => ({ ...p, segment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_SEGMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Aquisição</Label>
              <Select value={formData.acquisitionType} onValueChange={(v: AcquisitionType) => setFormData(p => ({ ...p, acquisitionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound (Prospecção ativa)</SelectItem>
                  <SelectItem value="inbound">Inbound (Tráfego / Orgânico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Temperatura</Label>
              <Select value={formData.temperature} onValueChange={(v: LeadTemperature) => setFormData(p => ({ ...p, temperature: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_TEMPERATURE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status do Funil</Label>
              <Select value={formData.funnelStatus} onValueChange={(v: LeadFunnelStatus) => setFormData(p => ({ ...p, funnelStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_FUNNEL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Potencial Estimado (R$)</Label>
              <Input type="number" value={formData.estimatedPotential || ''} onChange={e => setFormData(p => ({ ...p, estimatedPotential: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(v: LeadPriority) => setFormData(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Responsibles */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Responsáveis
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável Prospecção</Label>
              <Input value={formData.prospectionResponsible} onChange={e => setFormData(p => ({ ...p, prospectionResponsible: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável Fechamento</Label>
              <Input value={formData.closingResponsible} onChange={e => setFormData(p => ({ ...p, closingResponsible: e.target.value }))} />
            </div>

            {/* Follow-up */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Follow-up
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data do Último Contato</Label>
              <Input type="date" value={formData.lastContactDate} onChange={e => setFormData(p => ({ ...p, lastContactDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data da Próxima Ação</Label>
              <Input type="date" value={formData.nextActionDate} onChange={e => setFormData(p => ({ ...p, nextActionDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Próxima Ação</Label>
              <Input value={formData.nextAction} onChange={e => setFormData(p => ({ ...p, nextAction: e.target.value }))} />
            </div>

            {/* Notes */}
            <div className="space-y-3 md:col-span-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Observações
              </p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Textarea rows={4} value={formData.strategicNotes} onChange={e => setFormData(p => ({ ...p, strategicNotes: e.target.value }))} placeholder="Observações estratégicas sobre o lead..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" /> {editingLead ? 'Salvar' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailLead} onOpenChange={() => setDetailLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {detailLead.companyName}
                </DialogTitle>
                <DialogDescription>{detailLead.city}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <TemperatureBadge temp={detailLead.temperature} />
                  <FunnelStatusBadge status={detailLead.funnelStatus} />
                  <PriorityBadge priority={detailLead.priority} />
                  <Badge variant="outline" className="text-xs">{ACQUISITION_TYPE_LABELS[detailLead.acquisitionType]}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Contato:</span><p>{detailLead.contactName} — {detailLead.contactRole}</p></div>
                  <div><span className="text-muted-foreground text-xs">Telefone:</span><p>{detailLead.phone || '-'}</p></div>
                  <div><span className="text-muted-foreground text-xs">E-mail:</span><p>{detailLead.email || '-'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Origem:</span><p>{LEAD_ORIGIN_LABELS[detailLead.origin]}</p></div>
                  <div><span className="text-muted-foreground text-xs">Segmento:</span><p>{LEAD_SEGMENT_LABELS[detailLead.segment]}</p></div>
                  <div><span className="text-muted-foreground text-xs">Potencial:</span><p className="font-semibold">R$ {detailLead.estimatedPotential.toLocaleString('pt-BR')}</p></div>
                  <div><span className="text-muted-foreground text-xs">Resp. Prospecção:</span><p>{detailLead.prospectionResponsible || '-'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Resp. Fechamento:</span><p>{detailLead.closingResponsible || '-'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Último Contato:</span><p>{detailLead.lastContactDate ? format(new Date(detailLead.lastContactDate), 'dd/MM/yyyy') : '-'}</p></div>
                  <div><span className="text-muted-foreground text-xs">Próxima Ação:</span><p>{detailLead.nextAction || '-'}</p></div>
                </div>

                {detailLead.strategicNotes && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Observações Estratégicas</p>
                    <p className="text-sm whitespace-pre-wrap">{detailLead.strategicNotes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="gap-1" onClick={() => { setDetailLead(null); openEdit(detailLead); }}>
                    <Edit className="w-4 h-4" /> Editar
                  </Button>
                  {detailLead.funnelStatus === 'qualificado_crm' && (
                    <Button className="gap-1" onClick={() => { handleMigrateToCRM(detailLead); setDetailLead(null); }}>
                      <ArrowUpRight className="w-4 h-4" /> Migrar para CRM
                    </Button>
                  )}
                  {detailLead.funnelStatus === 'perdido' && (
                    <Button variant="outline" className="gap-1" onClick={() => { handleReactivate(detailLead); setDetailLead(null); }}>
                      <RotateCcw className="w-4 h-4" /> Reativar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este lead? Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
