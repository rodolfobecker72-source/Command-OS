import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useCRM } from '@/contexts/CRMContext';
import {
  LeadOrigin,
  LEAD_ORIGIN_LABELS,
  formatCNPJ,
  formatPhone,
} from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function EditClient() {
  const { id } = useParams<{ id: string }>();
  const { getClient, updateClient, isLoading: crmLoading } = useCRM();
  const navigate = useNavigate();

  const client = getClient(id || '');

  const [formData, setFormData] = useState({
    companyName: '',
    documentType: 'cnpj' as 'cnpj' | 'cpf',
    document: '',
    responsiblePerson: '',
    email: '',
    phone: '',
    leadOrigin: '' as LeadOrigin | '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load client data on mount
  useEffect(() => {
    if (client) {
      const cleanedDoc = client.cnpj.replace(/\D/g, '');
      const docType: 'cnpj' | 'cpf' = cleanedDoc.length === 11 ? 'cpf' : 'cnpj';
      setFormData({
        companyName: client.companyName,
        documentType: docType,
        document: formatDocumentInput(cleanedDoc, docType),
        responsiblePerson: client.responsiblePerson,
        email: client.email || '',
        phone: formatPhoneInput(client.phone),
        leadOrigin: client.leadOrigin,
      });
    }
  }, [client]);

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
          <Button onClick={() => navigate('/clientes')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
    }

    // Documento é opcional, mas se preenchido deve ter o tamanho correto
    const cleanedDoc = formData.document.replace(/\D/g, '');
    if (cleanedDoc) {
      if (formData.documentType === 'cnpj' && cleanedDoc.length !== 14) {
        newErrors.document = 'CNPJ deve ter 14 dígitos';
      } else if (formData.documentType === 'cpf' && cleanedDoc.length !== 11) {
        newErrors.document = 'CPF deve ter 11 dígitos';
      }
    }

    if (!formData.responsiblePerson.trim()) {
      newErrors.responsiblePerson = 'Pessoa responsável é obrigatória';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.leadOrigin) {
      newErrors.leadOrigin = 'Origem do lead é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EditClient] handleSubmit chamado', { clientId: client.id, formData, crmLoading });

    if (!validateForm()) {
      console.log('[EditClient] validação falhou', errors);
      return;
    }

    console.log('[EditClient] Chamando updateClient...');
    try {
      await updateClient(client.id, {
        companyName: formData.companyName,
        cnpj: formData.document.replace(/\D/g, ''),
        responsiblePerson: formData.responsiblePerson,
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        leadOrigin: formData.leadOrigin as LeadOrigin,
      });
      console.log('[EditClient] updateClient concluído com sucesso');
      toast.success('Cliente atualizado com sucesso!');
      navigate('/clientes');
    } catch (err) {
      console.error('[EditClient] Erro no updateClient:', err);
    }
  };

  const formatDocumentInput = (value: string, type: 'cnpj' | 'cpf') => {
    if (type === 'cpf') {
      const cleaned = value.replace(/\D/g, '').slice(0, 11);
      return cleaned.replace(
        /^(\d{3})(\d{3})?(\d{3})?(\d{2})?/,
        (_, p1, p2, p3, p4) => {
          let result = p1;
          if (p2) result += '.' + p2;
          if (p3) result += '.' + p3;
          if (p4) result += '-' + p4;
          return result;
        }
      );
    }
    // CNPJ
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    return cleaned.replace(
      /^(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/,
      (_, p1, p2, p3, p4, p5) => {
        let result = p1;
        if (p2) result += '.' + p2;
        if (p3) result += '.' + p3;
        if (p4) result += '/' + p4;
        if (p5) result += '-' + p5;
        return result;
      }
    );
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d{4})?(\d{4})?/, (_, p1, p2, p3) => {
        let result = '(' + p1;
        if (p2) result += ') ' + p2;
        if (p3) result += '-' + p3;
        return result;
      });
    }
    return cleaned.replace(/^(\d{2})(\d{5})?(\d{4})?/, (_, p1, p2, p3) => {
      let result = '(' + p1;
      if (p2) result += ') ' + p2;
      if (p3) result += '-' + p3;
      return result;
    });
  };




  return (
    <div className="min-h-screen bg-background">
      <Header title="Editar Cliente" subtitle="Atualize as informações do cliente" />

      <div className="p-6 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/clientes')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle>Dados do Cliente</CardTitle>
                  <CardDescription>
                    Atualize as informações do cliente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: Tech Solutions Ltda"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName}</p>
                  )}
                </div>

                {/* Document Type & Number */}
                <div className="space-y-2">
                  <Label>Documento (opcional)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.documentType}
                      onValueChange={(value: 'cnpj' | 'cpf') =>
                        setFormData({ ...formData, documentType: value, document: '' })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="document"
                      placeholder={formData.documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                      value={formData.document}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          document: formatDocumentInput(e.target.value, formData.documentType),
                        })
                      }
                      className={`flex-1 ${errors.document ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.document && (
                    <p className="text-sm text-destructive">{errors.document}</p>
                  )}
                </div>

                {/* Responsible Person */}
                <div className="space-y-2">
                  <Label htmlFor="responsiblePerson">Pessoa Responsável *</Label>
                  <Input
                    id="responsiblePerson"
                    placeholder="Nome do contato principal"
                    value={formData.responsiblePerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsiblePerson: e.target.value,
                      })
                    }
                    className={errors.responsiblePerson ? 'border-destructive' : ''}
                  />
                  {errors.responsiblePerson && (
                    <p className="text-sm text-destructive">
                      {errors.responsiblePerson}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: formatPhoneInput(e.target.value),
                      })
                    }
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Lead Origin */}
                <div className="space-y-2">
                  <Label htmlFor="leadOrigin">Origem do Lead *</Label>
                  <Select
                    value={formData.leadOrigin}
                    onValueChange={(value) =>
                      setFormData({ ...formData, leadOrigin: value as LeadOrigin })
                    }
                  >
                    <SelectTrigger
                      className={errors.leadOrigin ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_ORIGIN_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.leadOrigin && (
                    <p className="text-sm text-destructive">{errors.leadOrigin}</p>
                  )}
                </div>


                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/clientes')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 btn-hero">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}