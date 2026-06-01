import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{empresa_cliente}}
CNPJ: {{cnpj}}
Representante Legal: {{representante_legal}}
CPF: {{cpf_representante}}
E-mail: {{email_cliente}}
Telefone: {{telefone_cliente}}

CONTRATADA: {{empresa_contratada}}
Website: {{website_contratada}}
E-mail: {{email_contratada}}

CLÁUSULA 1 — OBJETO DO CONTRATO
A CONTRATADA se compromete a prestar os serviços descritos na proposta {{proposta_id}}, referente ao projeto "{{nome_projeto}}", conforme especificações detalhadas na proposta comercial anexa.

CLÁUSULA 2 — DESCRIÇÃO DO PROJETO
{{descricao_projeto}}

CLÁUSULA 3 — DO VALOR
O valor total dos serviços é de {{valor_total}}, conforme composição detalhada na proposta comercial anexa.

CLÁUSULA 4 — CONDIÇÕES DE PAGAMENTO
{{condicoes_pagamento}}

CLÁUSULA 5 — DO PRAZO
A execução dos serviços será realizada conforme cronograma acordado entre as partes.
{{datas_execucao}}

CLÁUSULA 6 — DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se obriga a executar os serviços com qualidade profissional, fornecendo equipe técnica qualificada e cumprindo os prazos acordados.

CLÁUSULA 7 — DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se obriga a fornecer acesso às locações e informações necessárias, aprovar materiais dentro dos prazos combinados e efetuar pagamentos conforme condições acordadas.

CLÁUSULA 8 — DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 15 dias. Em caso de rescisão após o início dos trabalhos, será devida a cobrança proporcional aos serviços já executados.

CLÁUSULA 9 — DO FORO
Fica eleito o foro da comarca de _________________ para dirimir quaisquer questões oriundas deste contrato.

Local e data: _________________, {{data_aprovacao}}

_______________________________
CONTRATANTE: {{empresa_cliente}}

_______________________________
CONTRATADA: {{empresa_contratada}}`;

const AVAILABLE_VARIABLES = [
  { key: '{{empresa_cliente}}', desc: 'Nome da empresa do cliente' },
  { key: '{{cnpj}}', desc: 'CNPJ do cliente' },
  { key: '{{responsavel}}', desc: 'Responsável pelo cliente (usa representante legal se cadastrado)' },
  { key: '{{representante_legal}}', desc: 'Nome do representante legal do cliente' },
  { key: '{{cpf_representante}}', desc: 'CPF do representante legal do cliente' },
  { key: '{{email_cliente}}', desc: 'E-mail do cliente' },
  { key: '{{telefone_cliente}}', desc: 'Telefone do cliente' },
  { key: '{{empresa_contratada}}', desc: 'Nome da sua empresa (do layout)' },
  { key: '{{website_contratada}}', desc: 'Website da sua empresa (do layout)' },
  { key: '{{email_contratada}}', desc: 'E-mail da sua empresa (do layout)' },
  { key: '{{proposta_id}}', desc: 'Identificador da proposta' },
  { key: '{{nome_projeto}}', desc: 'Nome do projeto' },
  { key: '{{descricao_projeto}}', desc: 'Descrição/briefing do projeto' },
  { key: '{{valor_total}}', desc: 'Valor total aprovado' },
  { key: '{{condicoes_pagamento}}', desc: 'Condições de pagamento' },
  { key: '{{datas_execucao}}', desc: 'Datas de início e fim da execução' },
  { key: '{{data_aprovacao}}', desc: 'Data de aprovação do orçamento' },
  { key: '{{servicos}}', desc: 'Lista dos serviços contratados' },
];

export function ContractTemplatePage() {
  const { workspace } = useAuth();
  const [content, setContent] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;
    loadTemplate();
  }, [workspace]);

  const loadTemplate = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_contract_template')
        .select('*')
        .eq('workspace_id', workspace.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setContent(data.content || DEFAULT_TEMPLATE);
        setTemplateId(data.id);
      }
    } catch (err) {
      console.error('Error loading contract template:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      if (templateId) {
        const { error } = await supabase
          .from('workspace_contract_template')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', templateId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workspace_contract_template')
          .insert({ workspace_id: workspace.id, content })
          .select()
          .single();
        if (error) throw error;
        setTemplateId(data.id);
      }
      toast.success('Template salvo com sucesso!');
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[data-template]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + variable + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setContent(prev => prev + variable);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Minuta de Contrato" subtitle="Carregando..." />
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Minuta de Contrato" subtitle="Configure o modelo de contrato para seus projetos" />

      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
        {/* Variables reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4" />
              Variáveis Disponíveis
            </CardTitle>
            <CardDescription>
              Clique em uma variável para inseri-la no template. Elas serão substituídas pelos dados reais ao gerar a minuta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  title={v.desc}
                  onClick={() => insertVariable(v.key)}
                >
                  {v.key}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template da Minuta
            </CardTitle>
            <CardDescription>
              Escreva o texto da minuta de contrato. Use as variáveis acima para dados dinâmicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              data-template="true"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
              placeholder="Digite o template da minuta de contrato..."
            />
            <div className="flex justify-end mt-4">
              <Button onClick={saveTemplate} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
