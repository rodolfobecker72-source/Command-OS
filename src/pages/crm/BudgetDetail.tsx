import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { generateProposalPDF } from '@/utils/pdfGenerator';
import { Header } from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import {
  CRMStatus,
  ServiceType,
  CostItem,
  PaymentStatus,
  PAYMENT_STATUS_LABELS,
  formatCurrency,
  formatCNPJ,
  formatPhone,
  calculateServiceTotals,
  ServiceItem,
  ExecutionCostItem,
  BudgetVersion,
  PaymentStatus as PaymentStatusType,
} from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Calculator,
  Download,
  Copy,
  CheckCircle,
  Upload,
  Building2,
  User,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit2,
  Save,
  Film,
  Camera,
  Smartphone,
  BarChart3,
  XCircle,
  Link,
  ExternalLink,
  Flag,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const SERVICE_ICONS: Record<string, typeof Film> = {
  CINE: Film,
  FOTO: Camera,
  MOBILE: Smartphone,
};

export function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getBudget, getClient, updateBudget, addBudgetVersion, approveBudget, updateBudgetVersion, updateExecutionCost, updateExecution, addExtraCost, removeExtraCost, deleteBudget, finalizeExecution, addDeliveryLink, removeDeliveryLink, kanbanColumns, getObjectivesForCategory, getCategoryLabel, serviceCategories, getHDForBudget } = useCRM();

  const budget = getBudget(id || '');
  const client = budget ? getClient(budget.clientId) : null;

  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [newVersionReason, setNewVersionReason] = useState('');
  const [newVersionServices, setNewVersionServices] = useState<ServiceItem[]>([]);
  const [newVersionOperationalCosts, setNewVersionOperationalCosts] = useState<CostItem[]>([]);
  const [newVersionFixedCostPct, setNewVersionFixedCostPct] = useState(20);
  const [newVersionNfPct, setNewVersionNfPct] = useState(13);
  const [newVersionTargetMargin, setNewVersionTargetMargin] = useState(0);
  const [approveOpen, setApproveOpen] = useState(false);
  const [executionNfValue, setExecutionNfValue] = useState<number>(0);
  const [isEditingNf, setIsEditingNf] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPaymentTerms, setEditedPaymentTerms] = useState('');
  const [editedProjectName, setEditedProjectName] = useState('');
  const [editedProjectDescription, setEditedProjectDescription] = useState('');
  const [editedProposalId, setEditedProposalId] = useState('');
  const [activeTab, setActiveTab] = useState('budget');
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Rejection dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVersionId, setRejectingVersionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Extra cost dialog states
  const [extraCostDialogOpen, setExtraCostDialogOpen] = useState(false);
  const [selectedServiceForExtraCost, setSelectedServiceForExtraCost] = useState<string | null>(null);
  const [newExtraCostDescription, setNewExtraCostDescription] = useState('');
  const [newExtraCostValue, setNewExtraCostValue] = useState<number>(0);
  const [newExtraCostSupplier, setNewExtraCostSupplier] = useState('');

  // Finalization dialog states
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalReport, setFinalReport] = useState('');
  
  // Delivery link states
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);
  
  // Notion link state
  const [notionInput, setNotionInput] = useState('');
  const [isEditingNotion, setIsEditingNotion] = useState(false);
  // Calculate totals for new version (hooks must be before early returns)
  const newVersionOperationalTotal = useMemo(() => {
    return newVersionOperationalCosts.reduce((sum, c) => sum + c.value, 0);
  }, [newVersionOperationalCosts]);

  const newVersionTotals = useMemo(() => {
    const productionCost = newVersionServices.reduce((sum, service) => {
      return sum + service.costs.reduce((s, c) => s + (c.value || 0), 0);
    }, 0);
    const fixedCost = productionCost * (newVersionFixedCostPct / 100);
    const operationalTotal = newVersionOperationalTotal;
    const totalCosts = productionCost + fixedCost + operationalTotal;

    const divisor = 1 - (newVersionTargetMargin / 100) - (newVersionNfPct / 100);
    const totalProjectValue = divisor > 0 ? totalCosts / divisor : totalCosts;
    const nfValue = totalProjectValue * (newVersionNfPct / 100);
    const marginValue = totalProjectValue - totalCosts - nfValue;

    return { productionCost, fixedCost, operationalTotal, totalCosts, totalProjectValue, nfValue, marginValue };
  }, [newVersionServices, newVersionOperationalTotal, newVersionFixedCostPct, newVersionNfPct, newVersionTargetMargin]);

  if (!budget || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Orçamento não encontrado</h2>
          <Button onClick={() => navigate('/crm')}>Voltar ao CRM</Button>
        </div>
      </div>
    );
  }

  const currentVersionData = budget.versions.find(
    (v) => v.version === budget.currentVersion
  );

  const handleStatusChange = (status: CRMStatus) => {
    updateBudget(budget.id, { status });
    toast.success('Status atualizado!');
  };

  const handleSaveEdit = () => {
    updateBudget(budget.id, { 
      proposalId: editedProposalId,
      paymentTerms: editedPaymentTerms,
      projectName: editedProjectName,
      projectDescription: editedProjectDescription,
    });
    setIsEditing(false);
    toast.success('Informações atualizadas!');
  };

  // Initialize new version services from current version
  const initNewVersionServices = () => {
    if (currentVersionData?.services) {
      setNewVersionServices(
        currentVersionData.services.map((s) => ({
          ...s,
          id: uuidv4(),
          costs: s.costs.map((c) => ({ ...c, id: uuidv4() })),
        }))
      );
    } else {
      setNewVersionServices([]);
    }
    setNewVersionOperationalCosts(
      (currentVersionData?.operationalCosts || []).map(c => ({ ...c, id: uuidv4() }))
    );
    setNewVersionFixedCostPct(currentVersionData?.fixedCostPercentage ?? 20);
    setNewVersionNfPct(currentVersionData?.nfCostPercentage ?? 13);
    setNewVersionTargetMargin(currentVersionData?.margin ?? 0);
  };

  // Update service in new version
  const updateNewVersionService = (serviceId: string, updates: Partial<ServiceItem>) => {
    setNewVersionServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
    );
  };

  // Add cost to service in new version
  const addCostToNewVersionService = (serviceId: string) => {
    setNewVersionServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              costs: [
                ...s.costs,
                {
                  id: uuidv4(),
                  description: '',
                  quantity: 1,
                  unitValue: 0,
                  value: 0,
                  paymentStatus: 'pendente' as PaymentStatus,
                  paymentDate: null,
                },
              ],
            }
          : s
      )
    );
  };

  // Update cost in new version service
  const updateNewVersionCost = (serviceId: string, costId: string, updates: Partial<CostItem>) => {
    setNewVersionServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              costs: s.costs.map((c) => (c.id === costId ? { ...c, ...updates } : c)),
            }
          : s
      )
    );
  };

  // Remove cost from new version service
  const removeNewVersionCost = (serviceId: string, costId: string) => {
    setNewVersionServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, costs: s.costs.filter((c) => c.id !== costId) }
          : s
      )
    );
  };

  // Add new service to new version
  const addServiceToNewVersion = (serviceType: ServiceType) => {
    setNewVersionServices((prev) => [
      ...prev,
      {
        id: uuidv4(),
        serviceType,
        objective: '',
        description: '',
        costs: [],
        fixedCostPercentage: 0,
        nfCostPercentage: 0,
        targetMargin: 0,
      },
    ]);
  };

  // Remove service from new version
  const removeServiceFromNewVersion = (serviceId: string) => {
    setNewVersionServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const handleCreateNewVersion = async () => {
    if (!newVersionReason.trim()) {
      toast.error('Informe o motivo da nova versão');
      return;
    }

    if (newVersionServices.length === 0) {
      toast.error('Adicione pelo menos um serviço');
      return;
    }

    await addBudgetVersion(budget.id, {
      services: newVersionServices,
      operationalCosts: newVersionOperationalCosts,
      costs: [],
      productionCost: newVersionTotals.productionCost,
      fixedCostPercentage: newVersionFixedCostPct,
      nfCostPercentage: newVersionNfPct,
      totalCost: newVersionTotals.totalCosts,
      fullPrice: newVersionTotals.totalProjectValue,
      discount4Price: newVersionTotals.totalProjectValue * 0.96,
      discount5Price: newVersionTotals.totalProjectValue * 0.95,
      margin: newVersionTargetMargin,
      reason: newVersionReason,
    });
    setNewVersionReason('');
    setNewVersionServices([]);
    setNewVersionOpen(false);
    toast.success(`Nova versão V${budget.currentVersion + 1} criada com sucesso!`);
  };

  const handleApprove = async () => {
    if (budget.currentVersion > 0) {
      await approveBudget(budget.id, budget.currentVersion);
      setApproveOpen(false);
      toast.success('Orçamento aprovado! Planilha de execução criada.');
    }
  };

  const handleUpdateExecutionSupplier = (serviceId: string, costId: string, supplier: string) => {
    updateExecutionCost(budget.id, serviceId, costId, { supplier });
  };

  const handleSaveNfValue = () => {
    if (budget.execution) {
      updateExecution(budget.id, { nfTaxValue: executionNfValue });
      setIsEditingNf(false);
      toast.success('Valor do imposto NF atualizado!');
    }
  };

  const handleUpdateExecutionCost = (serviceId: string, costId: string, realValue: number, isExtraCost = false) => {
    updateExecutionCost(budget.id, serviceId, costId, { realValue }, isExtraCost);
  };

  const handleUpdateExecutionPayment = (serviceId: string, costId: string, status: PaymentStatusType, date: Date | null, isExtraCost = false) => {
    updateExecutionCost(budget.id, serviceId, costId, { paymentStatus: status, paymentDate: date }, isExtraCost);
  };

  const handleUpdateExtraCostSupplier = (serviceId: string, costId: string, supplier: string) => {
    updateExecutionCost(budget.id, serviceId, costId, { supplier }, true);
  };

  const handleAddExtraCost = () => {
    if (!selectedServiceForExtraCost || !newExtraCostDescription.trim()) {
      toast.error('Preencha a descrição do gasto');
      return;
    }
    
    addExtraCost(budget.id, selectedServiceForExtraCost, {
      description: newExtraCostDescription,
      quantity: 1,
      unitValue: newExtraCostValue,
      value: newExtraCostValue,
      realValue: newExtraCostValue,
      paymentStatus: 'pendente',
      paymentDate: null,
      supplier: newExtraCostSupplier,
    });
    
    // Reset form
    setNewExtraCostDescription('');
    setNewExtraCostValue(0);
    setNewExtraCostSupplier('');
    setExtraCostDialogOpen(false);
    setSelectedServiceForExtraCost(null);
    toast.success('Gasto extra adicionado!');
  };

  const handleRemoveExtraCost = (serviceId: string, costId: string) => {
    removeExtraCost(budget.id, serviceId, costId);
    toast.success('Gasto extra removido!');
  };

  const handleRejectVersion = () => {
    if (!rejectingVersionId) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Informe o motivo da recusa');
      return;
    }
    
    updateBudgetVersion(budget.id, rejectingVersionId, { 
      isRejected: true, 
      rejectionReason: rejectionReason 
    });
    
    setRejectDialogOpen(false);
    setRejectingVersionId(null);
    setRejectionReason('');
    toast.success('Versão marcada como recusada');
  };

  const handleFinalizeExecution = () => {
    finalizeExecution(budget.id, finalReport);
    setFinalizeDialogOpen(false);
    setFinalReport('');
    toast.success('Execução finalizada com sucesso!');
  };

  const handleAddDeliveryLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.error('Preencha título e URL');
      return;
    }
    addDeliveryLink(budget.id, { title: newLinkTitle, url: newLinkUrl });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLink(false);
    toast.success('Link de entrega adicionado!');
  };

  const handleRemoveDeliveryLink = (linkId: string) => {
    removeDeliveryLink(budget.id, linkId);
    toast.success('Link removido!');
  };

  const generatePDFForVersion = async (version: BudgetVersion) => {
    if (!version.services || version.services.length === 0) {
      toast.error('Versão não possui serviços');
      return;
    }

    try {
      await generateProposalPDF({
        budget,
        version,
        client,
        responsibleUser: profile ? { id: profile.id, name: profile.name, photo: profile.photo_url || '' } : null,
      });
      toast.success(`PDF V${version.version} gerado com sucesso!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const generatePDF = () => {
    if (!currentVersionData) {
      toast.error('Nenhuma versão encontrada');
      return;
    }
    generatePDFForVersion(currentVersionData);
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-success';
    if (margin >= 25) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={`${budget.proposalId} - ${budget.projectName}`}
        subtitle="Detalhes do projeto"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/crm')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao CRM
          </Button>

          <div className="flex items-center gap-2">
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir Proposta</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja excluir a proposta "{budget.projectName}"? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      deleteBudget(budget.id);
                      toast.success('Proposta excluída com sucesso!');
                      navigate('/crm');
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Select value={budget.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...kanbanColumns].sort((a, b) => a.order - b.order).map((col) => (
                  <SelectItem key={col.key} value={col.key}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for Budget vs Execution */}
        {budget.status === 'aprovada' && budget.execution && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Orçamento
              </TabsTrigger>
              <TabsTrigger value="execution" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Execução
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-foreground/5">
                        <FileText className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <Input
                            value={editedProjectName}
                            onChange={(e) => setEditedProjectName(e.target.value)}
                            className="font-bold text-lg"
                            placeholder="Nome do projeto"
                          />
                        ) : (
                          <CardTitle>{budget.projectName}</CardTitle>
                        )}
                        <CardDescription>
                          {budget.proposalId} • Versão V{budget.currentVersion || 0}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={budget.status} />
                      {!isEditing && budget.status !== 'aprovada' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditedPaymentTerms(budget.paymentTerms);
                            setEditedProjectName(budget.projectName);
                            setEditedProjectDescription(budget.projectDescription || '');
                            setEditedProposalId(budget.proposalId);
                            setIsEditing(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Identificador da Proposta */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Identificador da Proposta</p>
                      {isEditing ? (
                        <Input
                          value={editedProposalId}
                          onChange={(e) => setEditedProposalId(e.target.value)}
                          placeholder="Ex: 850"
                        />
                      ) : (
                        <p className="font-medium">{budget.proposalId}</p>
                      )}
                    </div>

                    {/* Descrição Geral do Projeto */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Descrição Geral do Projeto</p>
                      {isEditing ? (
                        <Textarea
                          value={editedProjectDescription}
                          onChange={(e) => setEditedProjectDescription(e.target.value)}
                          placeholder="Descrição geral do projeto..."
                          rows={3}
                        />
                      ) : (
                        <p className="font-medium">{budget.projectDescription || 'Não definido'}</p>
                      )}
                    </div>
                    
                    {/* Condição de Pagamento */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Condição de Pagamento</p>
                      {isEditing ? (
                        <Input
                          value={editedPaymentTerms}
                          onChange={(e) => setEditedPaymentTerms(e.target.value)}
                          placeholder="Ex: 50% entrada + 50% na entrega"
                        />
                      ) : (
                        <p className="font-medium">{budget.paymentTerms || 'Não definido'}</p>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Budget View */}
            {activeTab === 'budget' && (
              <>
                {/* Services by Type */}
                {currentVersionData && currentVersionData.services && currentVersionData.services.length > 0 && (
                  <AnimatePresence mode="popLayout">
                    {currentVersionData.services.map((service, index) => {
                      const Icon = SERVICE_ICONS[service.serviceType];
                      const objectives = getObjectivesForCategory(service.serviceType);
                      const objectiveLabel = objectives.find(o => o.value === service.objective)?.label || service.objective;
                      const calc = calculateServiceTotals(service);

                      return (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <Card className="card-elevated border-l-4 border-l-foreground">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-3 rounded-xl bg-foreground text-background">
                                    <Icon className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <CardTitle className="flex items-center gap-2">
                                      <span className="text-xs font-bold px-2 py-1 bg-foreground text-background rounded">
                                        {service.serviceType}
                                      </span>
                                      {objectiveLabel}
                                    </CardTitle>
                                    <CardDescription>
                                      {service.description || 'Sem descrição'}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {/* Costs Table */}
                              <div className="rounded-lg border overflow-hidden mb-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead>Descrição</TableHead>
                                      <TableHead className="text-right w-[60px]">Qtd</TableHead>
                                      <TableHead className="text-right">V. Unit.</TableHead>
                                      <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {service.costs.map((cost) => (
                                      <TableRow key={cost.id}>
                                        <TableCell>{cost.description}</TableCell>
                                        <TableCell className="text-right">{cost.quantity || 1}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                          {formatCurrency(cost.unitValue || cost.value)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {formatCurrency(cost.value)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* Fixed Cost Row */}
                                    <TableRow className="bg-muted/30">
                                      <TableCell colSpan={3} className="text-muted-foreground">
                                        Custo Fixo ({service.fixedCostPercentage}%)
                                      </TableCell>
                                      <TableCell className="text-right font-medium text-muted-foreground">
                                        {formatCurrency(calc.fixedCost)}
                                      </TableCell>
                                    </TableRow>
                                    {/* NF Cost Row */}
                                    <TableRow className="bg-muted/30">
                                      <TableCell colSpan={3} className="text-muted-foreground">
                                        Imposto NF ({service.nfCostPercentage}%)
                                      </TableCell>
                                      <TableCell className="text-right font-medium text-muted-foreground">
                                        {formatCurrency(calc.nfCost)}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Service Calculations */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground">Investimento do Cliente</p>
                                  <p className="font-bold text-lg text-blue-500">{formatCurrency(calc.finalValue)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Custo de Produção</p>
                                  <p className="font-semibold text-orange-500">{formatCurrency(calc.totalCost)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Valor de Contribuição</p>
                                  <p className="font-bold text-lg text-success">{formatCurrency(calc.finalValue - calc.totalCost)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Margem</p>
                                  <p className="font-bold text-lg text-success">
                                    {calc.margin.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}

                {/* Operational Costs in Budget View */}
                {currentVersionData && (currentVersionData.operationalCosts || []).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Card className="card-elevated border-l-4 border-l-warning">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-warning/10">
                            <DollarSign className="w-6 h-6 text-warning" />
                          </div>
                          <div>
                            <CardTitle>Despesas Operacionais</CardTitle>
                            <CardDescription>
                              Custos gerais do projeto
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right w-[60px]">Qtd</TableHead>
                                <TableHead className="text-right">V. Unit.</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentVersionData.operationalCosts.map((cost) => (
                                <TableRow key={cost.id}>
                                  <TableCell>{cost.description}</TableCell>
                                  <TableCell className="text-right">{cost.quantity || 1}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(cost.unitValue || cost.value)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(cost.value)}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={3} className="font-semibold">
                                  Total Despesas Operacionais
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatCurrency(currentVersionData.operationalCosts.reduce((sum, c) => sum + c.value, 0))}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Version History */}
                {budget.versions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="card-elevated">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-muted">
                              <Calculator className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle>Histórico de Versões</CardTitle>
                              <CardDescription>
                                {budget.versions.length} versão(ões)
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {budget.status !== 'aprovada' && (
                              <>
                                <Dialog open={newVersionOpen} onOpenChange={(open) => {
                                  setNewVersionOpen(open);
                                  if (open) {
                                    initNewVersionServices();
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Copy className="w-4 h-4 mr-2" />
                                      Nova Versão
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Criar Nova Versão V{budget.currentVersion + 1}</DialogTitle>
                                      <DialogDescription>
                                        Edite os serviços, custos e margens antes de salvar a nova versão
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 py-4">
                                      {/* Reason */}
                                      <div className="space-y-2">
                                        <Label>Motivo da nova versão *</Label>
                                        <Textarea
                                          value={newVersionReason}
                                          onChange={(e) => setNewVersionReason(e.target.value)}
                                          placeholder="Ex: Cliente solicitou ajuste no escopo..."
                                        />
                                      </div>

                                      {/* Add Service Buttons */}
                                      <div className="space-y-2">
                                        <Label>Adicionar Serviço</Label>
                                        <div className="flex gap-2 flex-wrap">
                                          {[...serviceCategories].sort((a, b) => a.order - b.order).map((category) => {
                                            const Icon = SERVICE_ICONS[category.key] || Film;
                                            return (
                                              <Button
                                                key={category.key}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addServiceToNewVersion(category.key)}
                                              >
                                                <Icon className="w-4 h-4 mr-1" />
                                                {category.label}
                                              </Button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Services */}
                                      {newVersionServices.map((service, serviceIndex) => {
                                        const Icon = SERVICE_ICONS[service.serviceType];
                                        const objectives = getObjectivesForCategory(service.serviceType);
                                        const calc = calculateServiceTotals(service);

                                        return (
                                          <Card key={service.id} className="border-l-4 border-l-foreground">
                                            <CardHeader className="pb-3">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <Icon className="w-5 h-5" />
                                                  <span className="font-bold">{service.serviceType}</span>
                                                </div>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeServiceFromNewVersion(service.id)}
                                                >
                                                  <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                              {/* Objective, Description & Percentages */}
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label>Objetivo</Label>
                                                  <Select
                                                    value={service.objective}
                                                    onValueChange={(value) =>
                                                      updateNewVersionService(service.id, { objective: value })
                                                    }
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Selecionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {objectives.map((obj) => (
                                                        <SelectItem key={obj.value} value={obj.value}>
                                                          {obj.label}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>Descrição</Label>
                                                  <Textarea
                                                    value={service.description}
                                                    onChange={(e) =>
                                                      updateNewVersionService(service.id, { description: e.target.value })
                                                    }
                                                    placeholder="Descreva o serviço..."
                                                    rows={2}
                                                  />
                                                </div>
                                              </div>

                                              {/* Costs Table */}
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <Label>Custos</Label>
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addCostToNewVersionService(service.id)}
                                                  >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Item
                                                  </Button>
                                                </div>
                                                {service.costs.length > 0 && (
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow>
                                                        <TableHead>Descrição</TableHead>
                                                        <TableHead className="w-16">Qtd</TableHead>
                                                        <TableHead className="w-28">V. Unit.</TableHead>
                                                        <TableHead className="w-24">Total</TableHead>
                                                        <TableHead className="w-12"></TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {service.costs.map((cost) => (
                                                        <TableRow key={cost.id}>
                                                          <TableCell>
                                                            <Input
                                                              value={cost.description}
                                                              onChange={(e) =>
                                                                updateNewVersionCost(service.id, cost.id, {
                                                                  description: e.target.value,
                                                                })
                                                              }
                                                              placeholder="Descrição do custo"
                                                            />
                                                          </TableCell>
                                                          <TableCell>
                                                            <Input
                                                              type="number"
                                                              min={1}
                                                              value={cost.quantity || 1}
                                                              onChange={(e) => {
                                                                const qty = parseInt(e.target.value) || 1;
                                                                updateNewVersionCost(service.id, cost.id, {
                                                                  quantity: qty,
                                                                  value: qty * (cost.unitValue || 0),
                                                                });
                                                              }}
                                                            />
                                                          </TableCell>
                                                          <TableCell>
                                                            <Input
                                                              type="number"
                                                              min={0}
                                                              value={cost.unitValue || ''}
                                                              onChange={(e) => {
                                                                const uv = parseFloat(e.target.value) || 0;
                                                                updateNewVersionCost(service.id, cost.id, {
                                                                  unitValue: uv,
                                                                  value: (cost.quantity || 1) * uv,
                                                                });
                                                              }}
                                                            />
                                                          </TableCell>
                                                          <TableCell>
                                                            <span className="text-sm font-medium">
                                                              {formatCurrency(cost.value || 0)}
                                                            </span>
                                                          </TableCell>
                                                          <TableCell>
                                                            <Button
                                                              type="button"
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={() => removeNewVersionCost(service.id, cost.id)}
                                                            >
                                                              <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}
                                                    </TableBody>
                                                  </Table>
                                                )}
                                              </div>

                                              {/* Service Summary */}
                                              <div className="p-3 bg-muted rounded-lg text-sm">
                                                <p className="text-muted-foreground">Custo de Produção</p>
                                                <p className="font-semibold">{formatCurrency(calc.productionCost)}</p>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        );
                                      })}

                                      {/* Operational Costs in New Version */}
                                      <Card className="border-l-4 border-l-warning">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                              <DollarSign className="w-4 h-4 text-warning" />
                                              Despesas Operacionais
                                            </CardTitle>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setNewVersionOperationalCosts(prev => [...prev, {
                                                  id: uuidv4(),
                                                  description: '',
                                                  quantity: 1,
                                                  unitValue: 0,
                                                  value: 0,
                                                  paymentStatus: 'pendente' as PaymentStatus,
                                                  paymentDate: null,
                                                }]);
                                              }}
                                            >
                                              <Plus className="w-3 h-3 mr-1" />
                                              Adicionar
                                            </Button>
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          {newVersionOperationalCosts.length > 0 ? (
                                            <Table>
                                              <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                  <TableHead>Descrição</TableHead>
                                                  <TableHead className="w-[70px]">Qtd</TableHead>
                                                  <TableHead>V. Unit.</TableHead>
                                                  <TableHead>Total</TableHead>
                                                  <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {newVersionOperationalCosts.map((cost) => (
                                                  <TableRow key={cost.id}>
                                                    <TableCell>
                                                      <Input
                                                        value={cost.description}
                                                        onChange={(e) =>
                                                          setNewVersionOperationalCosts(prev => prev.map(c =>
                                                            c.id === cost.id ? { ...c, description: e.target.value } : c
                                                          ))
                                                        }
                                                        placeholder="Ex: Passagens, Hotel..."
                                                        className="h-8"
                                                      />
                                                    </TableCell>
                                                    <TableCell>
                                                      <Input
                                                        type="number"
                                                        min="1"
                                                        value={cost.quantity || 1}
                                                        onChange={(e) => {
                                                          const qty = parseInt(e.target.value) || 1;
                                                          setNewVersionOperationalCosts(prev => prev.map(c =>
                                                            c.id === cost.id ? { ...c, quantity: qty, value: qty * (c.unitValue || 0) } : c
                                                          ));
                                                        }}
                                                        className="h-8 w-16"
                                                      />
                                                    </TableCell>
                                                    <TableCell>
                                                      <Input
                                                        type="number"
                                                        value={cost.unitValue || ''}
                                                        onChange={(e) => {
                                                          const uv = parseFloat(e.target.value) || 0;
                                                          setNewVersionOperationalCosts(prev => prev.map(c =>
                                                            c.id === cost.id ? { ...c, unitValue: uv, value: (c.quantity || 1) * uv } : c
                                                          ));
                                                        }}
                                                        placeholder="0,00"
                                                        className="h-8 w-28"
                                                      />
                                                    </TableCell>
                                                    <TableCell>
                                                      <span className="text-sm font-medium">
                                                        {formatCurrency(cost.value || 0)}
                                                      </span>
                                                    </TableCell>
                                                    <TableCell>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNewVersionOperationalCosts(prev => prev.filter(c => c.id !== cost.id))}
                                                      >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                      </Button>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                                <TableRow className="bg-muted/30">
                                                  <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                                                  <TableCell className="font-bold">{formatCurrency(newVersionOperationalTotal)}</TableCell>
                                                  <TableCell />
                                                </TableRow>
                                              </TableBody>
                                            </Table>
                                          ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa operacional</p>
                                          )}
                                        </CardContent>
                                      </Card>

                                      {/* Composição do Investimento */}
                                      {newVersionServices.length > 0 && (
                                        <Card className="border-l-4 border-l-primary">
                                          <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                              <Calculator className="w-4 h-4 text-primary" />
                                              Composição do Investimento
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                              <div className="space-y-2">
                                                <Label>Custo Fixo (%)</Label>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={newVersionFixedCostPct}
                                                  onChange={(e) => setNewVersionFixedCostPct(parseFloat(e.target.value) || 0)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Nota Fiscal (%)</Label>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={newVersionNfPct}
                                                  onChange={(e) => setNewVersionNfPct(parseFloat(e.target.value) || 0)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Margem Desejada (%)</Label>
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  max={99}
                                                  value={newVersionTargetMargin}
                                                  onChange={(e) => setNewVersionTargetMargin(parseFloat(e.target.value) || 0)}
                                                />
                                              </div>
                                            </div>

                                            <div className="space-y-2 p-4 bg-muted rounded-lg text-sm">
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Custo de Produção</span>
                                                <span className="font-medium">{formatCurrency(newVersionTotals.productionCost)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Custo Fixo ({newVersionFixedCostPct}%)</span>
                                                <span className="font-medium">{formatCurrency(newVersionTotals.fixedCost)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Despesas Operacionais</span>
                                                <span className="font-medium">{formatCurrency(newVersionTotals.operationalTotal)}</span>
                                              </div>
                                              <div className="flex justify-between border-t pt-2">
                                                <span className="font-semibold">Total dos Custos</span>
                                                <span className="font-semibold">{formatCurrency(newVersionTotals.totalCosts)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Margem ({newVersionTargetMargin}%)</span>
                                                <span className="font-medium">{formatCurrency(newVersionTotals.marginValue)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nota Fiscal ({newVersionNfPct}%)</span>
                                                <span className="font-medium">{formatCurrency(newVersionTotals.nfValue)}</span>
                                              </div>
                                              <div className="flex justify-between border-t pt-2">
                                                <span className="font-bold text-base">Valor Total do Projeto</span>
                                                <span className="font-bold text-base text-primary">{formatCurrency(newVersionTotals.totalProjectValue)}</span>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setNewVersionOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleCreateNewVersion}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar V{budget.currentVersion + 1}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="bg-success hover:bg-success/90">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Aprovar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Aprovar Orçamento</DialogTitle>
                                      <DialogDescription>
                                        Confirma a aprovação da versão V{budget.currentVersion}?
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                      <div>
                                        <p className="text-sm">
                                          Valor final:{' '}
                                          <span className="font-bold">
                                            {formatCurrency(currentVersionData?.fullPrice || 0)}
                                          </span>
                                        </p>
                                      </div>

                                      <p className="text-xs text-muted-foreground">
                                        Uma planilha de execução será criada automaticamente para acompanhar os custos reais.
                                      </p>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setApproveOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button className="bg-success hover:bg-success/90" onClick={handleApprove}>
                                        Confirmar Aprovação
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}

                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {budget.versions.map((version) => (
                            <div
                              key={version.id}
                              className={`p-4 rounded-lg border ${
                                version.version === budget.approvedVersion
                                  ? 'border-success bg-success/5'
                                  : version.isRejected
                                  ? 'border-destructive/30 bg-destructive/5'
                                  : version.version === budget.currentVersion
                                  ? 'border-foreground/20 bg-muted/50'
                                  : 'border-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">V{version.version}</span>
                                  {version.version === budget.approvedVersion && (
                                    <span className="text-xs bg-success text-success-foreground px-2 py-0.5 rounded">
                                      Aprovada
                                    </span>
                                  )}
                                  {version.isRejected && (
                                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                                      Recusada
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{formatCurrency(version.fullPrice)}</span>
                                  {!version.isRejected && budget.status !== 'aprovada' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setRejectingVersionId(version.id);
                                        setRejectDialogOpen(true);
                                      }}
                                      title="Marcar como recusada"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => generatePDFForVersion(version)}
                                    title={`Gerar PDF V${version.version}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{version.reason}</p>
                              {version.isRejected && version.rejectionReason && (
                                <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                                  <p className="text-xs text-destructive font-medium mb-1">Motivo da recusa:</p>
                                  <p className="text-destructive/80">{version.rejectionReason}</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(version.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}

            {/* Execution View */}
            {activeTab === 'execution' && budget.execution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="card-elevated border-2 border-success/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-success/10">
                        <BarChart3 className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <CardTitle>Planilha de Execução</CardTitle>
                        <CardDescription>
                          Acompanhe os custos reais vs. orçados
                        </CardDescription>
                      </div>
                      {(() => {
                        const hdInfo = getHDForBudget(budget.id);
                        return hdInfo ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1">
                            <HardDrive className="w-3.5 h-3.5" />
                            {hdInfo.hdLabel}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Resumo do Projeto */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Resumo do Projeto</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Investimento Total do Cliente</p>
                          <p className="font-bold text-lg text-blue-500">{formatCurrency(budget.finalValue || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Custo Orçado</p>
                          <p className="font-bold text-lg text-orange-500">{formatCurrency(budget.execution.budgetedTotal)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Custo Real</p>
                          <p className="font-bold text-lg text-destructive">
                            {formatCurrency(budget.execution.realTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Imposto NF</p>
                          {isEditingNf ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={executionNfValue}
                                onChange={(e) => setExecutionNfValue(parseFloat(e.target.value) || 0)}
                                className="w-24 h-8"
                              />
                              <Button size="sm" variant="ghost" onClick={handleSaveNfValue}>
                                <Save className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="font-bold text-lg cursor-pointer hover:text-primary flex items-center gap-1"
                              onClick={() => {
                                setExecutionNfValue(budget.execution?.nfTaxValue || 0);
                                setIsEditingNf(true);
                              }}
                            >
                              {formatCurrency(budget.execution.nfTaxValue)}
                              <Edit2 className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margem Real</p>
                          {(() => {
                            const investimento = budget.finalValue || 0;
                            const custoRealComImposto = budget.execution.realTotal + (budget.execution.nfTaxValue || 0);
                            const margemReal = investimento > 0 
                              ? ((investimento - custoRealComImposto) / investimento) * 100 
                              : 0;
                            return (
                              <p className={`font-bold text-lg ${getMarginColor(margemReal)}`}>
                                {margemReal.toFixed(1)}%
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Services Execution */}
                    {budget.execution.services.map((service) => {
                      const Icon = SERVICE_ICONS[service.serviceType];
                      const objectives = getObjectivesForCategory(service.serviceType);
                      const objectiveLabel = objectives.find(o => o.value === service.objective)?.label || service.objective;
                      const extraCosts = service.extraCosts || [];

                      return (
                        <div key={service.id} className="mb-6 last:mb-0">
                          {/* Service Header */}
                          <div className="flex items-center mb-3 p-3 bg-foreground/5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-foreground text-background rounded-lg">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{service.serviceType}</span>
                                  <span className="text-muted-foreground">-</span>
                                  <span>{objectiveLabel}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Main Costs Table */}
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="text-right">Orçado</TableHead>
                                  <TableHead className="text-right">Real</TableHead>
                                  <TableHead>Fornecedor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Data Pgto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {service.costs.map((cost) => (
                                  <TableRow key={cost.id}>
                                    <TableCell>{cost.description}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {formatCurrency(cost.budgetedValue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        value={cost.realValue}
                                        onChange={(e) => handleUpdateExecutionCost(
                                          service.id,
                                          cost.id,
                                          parseFloat(e.target.value) || 0,
                                          false
                                        )}
                                        className="w-28 text-right h-8"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="text"
                                        value={cost.supplier || ''}
                                        onChange={(e) => handleUpdateExecutionSupplier(
                                          service.id,
                                          cost.id,
                                          e.target.value
                                        )}
                                        placeholder="Quem executou"
                                        className="w-32 h-8"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={cost.paymentStatus}
                                        onValueChange={(value) => handleUpdateExecutionPayment(
                                          service.id,
                                          cost.id,
                                          value as PaymentStatusType,
                                          value === 'pago' ? new Date() : null,
                                          false
                                        )}
                                      >
                                        <SelectTrigger className="w-28 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                              {label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {cost.paymentDate
                                        ? new Date(cost.paymentDate).toLocaleDateString('pt-BR')
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Extra Costs Section */}
                          {extraCosts.length > 0 && (
                            <div className="mt-3 rounded-lg border border-warning/30 overflow-hidden">
                              <div className="bg-warning/10 px-4 py-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-warning">Gastos Extras (não previstos)</span>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-warning/5">
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data Pgto</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {extraCosts.map((cost) => (
                                    <TableRow key={cost.id}>
                                      <TableCell>{cost.description}</TableCell>
                                      <TableCell className="text-right">
                                        <Input
                                          type="number"
                                          value={cost.realValue}
                                          onChange={(e) => handleUpdateExecutionCost(
                                            service.id,
                                            cost.id,
                                            parseFloat(e.target.value) || 0,
                                            true
                                          )}
                                          className="w-28 text-right h-8"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="text"
                                          value={cost.supplier || ''}
                                          onChange={(e) => handleUpdateExtraCostSupplier(
                                            service.id,
                                            cost.id,
                                            e.target.value
                                          )}
                                          placeholder="Quem executou"
                                          className="w-32 h-8"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={cost.paymentStatus}
                                          onValueChange={(value) => handleUpdateExecutionPayment(
                                            service.id,
                                            cost.id,
                                            value as PaymentStatusType,
                                            value === 'pago' ? new Date() : null,
                                            true
                                          )}
                                        >
                                          <SelectTrigger className="w-28 h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                                              <SelectItem key={value} value={value}>
                                                {label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {cost.paymentDate
                                          ? new Date(cost.paymentDate).toLocaleDateString('pt-BR')
                                          : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveExtraCost(service.id, cost.id)}
                                        >
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Add Extra Cost Button */}
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedServiceForExtraCost(service.id);
                                setExtraCostDialogOpen(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar gasto extra
                            </Button>
                          </div>

                          {/* Resumo por Entrega */}
                          <div className="mt-3">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Resumo por Entrega</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Investimento do Cliente</p>
                                <p className="font-semibold text-blue-500">{formatCurrency(service.budgetedFinalValue || service.finalValue)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Custo Orçado</p>
                                <p className="font-semibold text-orange-500">{formatCurrency(service.budgetedTotal)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Custo Real</p>
                                <p className="font-semibold text-destructive">
                                  {formatCurrency(service.realTotal)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Imposto NF</p>
                                <p className="font-semibold">{formatCurrency(service.nfTaxProportion || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Margem Real</p>
                                <p className={`font-semibold ${
                                  service.finalValue > 0 
                                    ? ((service.finalValue - service.realTotal - (service.nfTaxProportion || 0)) / service.finalValue * 100) >= 40 
                                      ? 'text-success' 
                                      : ((service.finalValue - service.realTotal - (service.nfTaxProportion || 0)) / service.finalValue * 100) >= 25 
                                        ? 'text-warning' 
                                        : 'text-destructive'
                                    : ''
                                }`}>
                                  {service.finalValue > 0 
                                    ? `${((service.finalValue - service.realTotal - (service.nfTaxProportion || 0)) / service.finalValue * 100).toFixed(1)}%`
                                    : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Operational Costs in Execution */}
                    {(() => {
                      const opCosts = budget.execution.operationalCosts || [];
                      const extraOpCosts = budget.execution.extraOperationalCosts || [];
                      if (opCosts.length === 0 && extraOpCosts.length === 0) return null;
                      const opTotal = opCosts.reduce((sum, c) => sum + c.realValue, 0) + extraOpCosts.reduce((sum, c) => sum + c.realValue, 0);
                      const opBudgeted = opCosts.reduce((sum, c) => sum + c.budgetedValue, 0);
                      
                      return (
                        <div className="mb-6">
                          <div className="flex items-center mb-3 p-3 bg-warning/5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-warning/20 text-warning rounded-lg">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <span className="font-bold">Despesas Operacionais</span>
                            </div>
                          </div>
                          
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead>Descrição</TableHead>
                                  <TableHead className="text-right">Orçado</TableHead>
                                  <TableHead className="text-right">Real</TableHead>
                                  <TableHead>Fornecedor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Data Pgto</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {opCosts.map((cost) => (
                                  <TableRow key={cost.id}>
                                    <TableCell>{cost.description}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {formatCurrency(cost.budgetedValue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        value={cost.realValue}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          updateExecution(budget.id, {
                                            operationalCosts: (budget.execution?.operationalCosts || []).map(c =>
                                              c.id === cost.id ? { ...c, realValue: val } : c
                                            ),
                                          });
                                        }}
                                        className="w-28 text-right h-8"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="text"
                                        value={cost.supplier || ''}
                                        onChange={(e) => {
                                          updateExecution(budget.id, {
                                            operationalCosts: (budget.execution?.operationalCosts || []).map(c =>
                                              c.id === cost.id ? { ...c, supplier: e.target.value } : c
                                            ),
                                          });
                                        }}
                                        placeholder="Quem executou"
                                        className="w-32 h-8"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={cost.paymentStatus}
                                        onValueChange={(value) => {
                                          updateExecution(budget.id, {
                                            operationalCosts: (budget.execution?.operationalCosts || []).map(c =>
                                              c.id === cost.id ? { ...c, paymentStatus: value as PaymentStatusType, paymentDate: value === 'pago' ? new Date() : null } : c
                                            ),
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="w-28 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                              {label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {cost.paymentDate
                                        ? new Date(cost.paymentDate).toLocaleDateString('pt-BR')
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Orçado</p>
                              <p className="font-semibold text-orange-500">{formatCurrency(opBudgeted)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Real</p>
                              <p className="font-semibold text-destructive">{formatCurrency(opTotal)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Project Management Link (Notion) */}
                    <div className="mt-8 pt-6 border-t">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Gestão do Projeto
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Cole o link do Notion onde é feita a gestão deste projeto
                        </p>
                        {budget.execution?.notionLink && !isEditingNotion ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={budget.execution.notionLink}
                              readOnly
                              className="flex-1 bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={budget.execution.notionLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Abrir
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNotionInput(budget.execution?.notionLink || '');
                                setIsEditingNotion(true);
                              }}
                            >
                              Editar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="https://notion.so/..."
                              value={notionInput}
                              onChange={(e) => setNotionInput(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              disabled={!notionInput.trim()}
                              onClick={() => {
                                if (budget.execution && notionInput.trim()) {
                                  const updated = { ...budget, execution: { ...budget.execution, notionLink: notionInput.trim() } };
                                  updateBudget(budget.id, updated);
                                  setNotionInput('');
                                  setIsEditingNotion(false);
                                }
                              }}
                            >
                              Salvar
                            </Button>
                            {isEditingNotion && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingNotion(false)}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Finalization Section */}
                    <div className="mt-8 pt-6 border-t">
                      {budget.execution.isFinalized ? (
                        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-5 h-5 text-success" />
                            <span className="font-semibold text-success">Execução Finalizada</span>
                          </div>
                          {budget.execution.finalizedAt && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Finalizado em {new Date(budget.execution.finalizedAt).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {budget.execution.finalReport && (
                            <div className="mt-3 p-3 bg-background/50 rounded">
                              <p className="text-xs text-muted-foreground mb-1">Relatório Final:</p>
                              <p className="text-sm">{budget.execution.finalReport}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">Finalizar Execução</h3>
                            <p className="text-sm text-muted-foreground">
                              Consolide a operação e gere um relatório final
                            </p>
                          </div>
                          <Button onClick={() => setFinalizeDialogOpen(true)}>
                            <Flag className="w-4 h-4 mr-2" />
                            Finalizar Execução
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* If Approved - Show approval info */}
            {budget.status === 'aprovada' && activeTab === 'budget' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="card-elevated border-success/30 bg-success/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-success/10">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-success">Projeto Aprovado</CardTitle>
                        <CardDescription>
                          {budget.approvalDate &&
                            `Aprovado em ${new Date(budget.approvalDate).toLocaleDateString('pt-BR')}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Versão Aprovada</p>
                        <p className="font-bold text-lg">V{budget.approvedVersion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Final</p>
                        <p className="font-bold text-lg text-success">
                          {formatCurrency(budget.finalValue || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button variant="outline" className="flex-1">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Contrato
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Nota Fiscal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Client Info & Stats */}
          <div className="space-y-6">
            {/* Client Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Cliente</CardTitle>
                    <ScoreBadge score={client.score} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{client.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCNPJ(client.cnpj)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{client.responsiblePerson}</p>
                      <p className="text-xs text-muted-foreground">Responsável</p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-success/10 hover:bg-success/20 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-success" />
                    <div>
                      <p className="font-medium text-success">
                        {formatPhone(client.phone)}
                      </p>
                      <p className="text-xs text-success/80">WhatsApp</p>
                    </div>
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            {currentVersionData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Valor Final</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(currentVersionData.fullPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Custo Total</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(currentVersionData.totalCost)}
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        currentVersionData.margin >= 40
                          ? 'bg-success/10'
                          : currentVersionData.margin >= 25
                          ? 'bg-warning/10'
                          : 'bg-destructive/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`w-4 h-4 ${getMarginColor(currentVersionData.margin)}`}
                        />
                        <span className="text-sm">Margem</span>
                      </div>
                      <span className={`font-bold ${getMarginColor(currentVersionData.margin)}`}>
                        {currentVersionData.margin.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                      <div>
                        <p className="text-sm font-medium">Orçamento Criado</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(budget.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {budget.versions.map((version) => (
                      <div key={version.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Versão V{version.version}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {budget.approvalDate && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <div>
                          <p className="text-sm font-medium text-success">Aprovado</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(budget.approvalDate).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {budget.execution?.isFinalized && budget.execution.finalizedAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium text-primary">Execução Finalizada</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(budget.execution.finalizedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Extra Cost Dialog */}
      <Dialog open={extraCostDialogOpen} onOpenChange={setExtraCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Gasto Extra</DialogTitle>
            <DialogDescription>
              Adicione um gasto que não estava previsto no orçamento original
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={newExtraCostDescription}
                onChange={(e) => setNewExtraCostDescription(e.target.value)}
                placeholder="Ex: Transporte adicional, Equipamento extra..."
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={newExtraCostValue}
                onChange={(e) => setNewExtraCostValue(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input
                value={newExtraCostSupplier}
                onChange={(e) => setNewExtraCostSupplier(e.target.value)}
                placeholder="Quem executou"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtraCostDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddExtraCost}>
              Adicionar Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Proposta como Recusada</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual o cliente recusou esta proposta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da recusa *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Cliente optou por outra proposta, valor acima do orçamento..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setRejectingVersionId(null);
              setRejectionReason('');
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectVersion}>
              <XCircle className="w-4 h-4 mr-2" />
              Marcar como Recusada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Execution Dialog */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Execução</DialogTitle>
            <DialogDescription>
              Consolide a operação. Você ainda poderá editar os dados após finalizar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Relatório Final (opcional)</Label>
              <Textarea
                value={finalReport}
                onChange={(e) => setFinalReport(e.target.value)}
                placeholder="Observações finais, aprendizados, feedback do cliente..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFinalizeDialogOpen(false);
              setFinalReport('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizeExecution}>
              <Flag className="w-4 h-4 mr-2" />
              Finalizar Execução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
