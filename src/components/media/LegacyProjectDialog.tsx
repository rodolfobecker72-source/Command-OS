import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { LEAD_ORIGIN_LABELS, LeadOrigin } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Archive, Search, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';

export function LegacyProjectDialog() {
  const { clients, addClient, addLegacyProject } = useCRM();

  const [open, setOpen] = useState(false);
  const [projectNumber, setProjectNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [sizeGB, setSizeGB] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);

  // New client inline form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newResponsiblePerson, setNewResponsiblePerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLeadOrigin, setNewLeadOrigin] = useState<LeadOrigin>('cliente_antigo');

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 10);
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      c.responsiblePerson.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [clients, clientSearch]);

  const resetForm = () => {
    setProjectNumber('');
    setSelectedClientId('');
    setSelectedClientName('');
    setSizeGB('');
    setClientSearch('');
    setShowNewClient(false);
    setNewCompanyName('');
    setNewResponsiblePerson('');
    setNewPhone('');
    setNewLeadOrigin('cliente_antigo');
  };

  const handleCreateClient = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Informe o nome da empresa');
      return;
    }
    if (!newResponsiblePerson.trim()) {
      toast.error('Informe o responsável');
      return;
    }

    const newClient = await addClient({
      companyName: newCompanyName.trim(),
      cnpj: '',
      responsiblePerson: newResponsiblePerson.trim(),
      email: '',
      phone: newPhone.trim(),
      leadOrigin: newLeadOrigin,
      score: 0,
    });

    if (newClient) {
      setSelectedClientId(newClient.id);
      setSelectedClientName(newClient.companyName);
      setShowNewClient(false);
      setClientSearch('');
      toast.success(`Cliente "${newClient.companyName}" cadastrado!`);
    }
  };

  const handleSave = async () => {
    if (!projectNumber.trim()) {
      toast.error('Informe o número do projeto');
      return;
    }
    if (!selectedClientId) {
      toast.error('Selecione ou cadastre um cliente');
      return;
    }
    const size = parseFloat(sizeGB);
    if (!size || size <= 0) {
      toast.error('Informe o tamanho do material');
      return;
    }

    await addLegacyProject({
      projectNumber: projectNumber.trim(),
      clientId: selectedClientId,
      clientName: selectedClientName,
      sizeGB: size,
    });

    toast.success('Projeto anterior cadastrado com sucesso!');
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Archive className="w-4 h-4 mr-2" />
          Projeto Anterior
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar Projeto Anterior</DialogTitle>
          <DialogDescription>
            Cadastre projetos anteriores a 2026 que não existem no sistema CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Project Number */}
          <div className="space-y-2">
            <Label>Nº do Projeto</Label>
            <Input
              placeholder="Ex: 425"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente</Label>
              {!showNewClient && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => setShowNewClient(true)}
                >
                  <UserPlus className="w-3 h-3" />
                  Novo cliente
                </Button>
              )}
            </div>

            {selectedClientId && !showNewClient ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">{selectedClientName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 text-xs"
                  onClick={() => { setSelectedClientId(''); setSelectedClientName(''); }}
                >
                  Alterar
                </Button>
              </div>
            ) : !showNewClient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {(clientSearch || clients.length > 0) && (
                  <div className="max-h-36 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setSelectedClientName(client.companyName);
                            setClientSearch('');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-medium text-foreground">{client.companyName}</div>
                          <div className="text-xs text-muted-foreground">{client.responsiblePerson}</div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum cliente encontrado</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Inline New Client Form */
              <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Novo Cliente</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowNewClient(false)}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nome da Empresa *</Label>
                  <Input
                    placeholder="Ex: Empresa XYZ"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Responsável *</Label>
                  <Input
                    placeholder="Nome do responsável"
                    value={newResponsiblePerson}
                    onChange={(e) => setNewResponsiblePerson(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Origem do Lead</Label>
                  <Select value={newLeadOrigin} onValueChange={(v) => setNewLeadOrigin(v as LeadOrigin)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_ORIGIN_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="w-full btn-hero" onClick={handleCreateClient}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Cadastrar Cliente
                </Button>
              </div>
            )}
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>Tamanho do Material (GB)</Label>
            <Input
              type="number"
              placeholder="Ex: 250"
              value={sizeGB}
              onChange={(e) => setSizeGB(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} className="btn-hero">
            Cadastrar Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
