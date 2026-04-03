

## Editor completo de Layout do PDF da Proposta Comercial

### O que será feito

Transformar a página de Layout do PDF em um editor completo, permitindo personalizar todos os textos e títulos do documento de proposta comercial, incluindo os termos e condições da última página.

### Migration - novos campos na tabela `workspace_layout`

Adicionar colunas para armazenar os textos configuráveis:

```sql
ALTER TABLE workspace_layout
  ADD COLUMN pdf_title text NOT NULL DEFAULT 'PROPOSTA COMERCIAL',
  ADD COLUMN section_client_title text NOT NULL DEFAULT 'CLIENTE',
  ADD COLUMN section_briefing_title text NOT NULL DEFAULT 'BRIEFING DO PROJETO',
  ADD COLUMN section_inclusions_title text NOT NULL DEFAULT 'O QUE ESTÁ INCLUSO',
  ADD COLUMN section_services_title text NOT NULL DEFAULT 'SERVIÇOS',
  ADD COLUMN section_operational_title text NOT NULL DEFAULT 'DESPESAS OPERACIONAIS',
  ADD COLUMN section_investment_title text NOT NULL DEFAULT 'COMPOSIÇÃO DO INVESTIMENTO',
  ADD COLUMN section_total_title text NOT NULL DEFAULT 'INVESTIMENTO TOTAL',
  ADD COLUMN section_terms_title text NOT NULL DEFAULT 'TERMOS E CONDIÇÕES',
  ADD COLUMN terms_company_label text NOT NULL DEFAULT 'Responsabilidades da HERO:',
  ADD COLUMN terms_company_items text NOT NULL DEFAULT '• Executar os serviços descritos com qualidade profissional
• Fornecer equipe técnica qualificada
• Cumprir os prazos acordados
• Realizar até 2 rodadas de revisão',
  ADD COLUMN terms_client_label text NOT NULL DEFAULT 'Responsabilidades do Cliente:',
  ADD COLUMN terms_client_items text NOT NULL DEFAULT '• Fornecer acesso às locações e informações necessárias
• Aprovar materiais dentro dos prazos combinados
• Efetuar pagamentos conforme condições acordadas',
  ADD COLUMN terms_general_label text NOT NULL DEFAULT 'Condições Gerais:',
  ADD COLUMN terms_general_items text NOT NULL DEFAULT '• Proposta válida por 30 dias
• Alterações de escopo podem gerar custos adicionais
• Cancelamento após início sujeito a cobrança proporcional',
  ADD COLUMN terms_approval_text text NOT NULL DEFAULT 'A aprovação desta proposta implica na aceitação dos termos acima.',
  ADD COLUMN validity_text text NOT NULL DEFAULT 'Validade: 30 dias';
```

### Alterações em arquivos

| Arquivo | Alteração |
|---|---|
| **`src/pages/settings/LayoutPage.tsx`** | Expandir com seções de edição: (1) Cabeçalho - logo + título do PDF, (2) Títulos das seções - campos de texto para cada título, (3) Texto de validade, (4) Termos e Condições - 3 blocos com label + textarea para os itens, (5) Texto de aprovação. Organizar em cards com accordion ou tabs para não ficar extenso. |
| **`src/utils/pdfGenerator.ts`** | Ampliar `PDFLayoutSettings` com todos os novos campos. Substituir todos os textos hardcoded por valores do `layoutSettings`, usando os defaults atuais como fallback. |
| **`src/pages/crm/BudgetDetail.tsx`** | Passar os novos campos do layout ao chamar `generateProposalPDF` (já busca `workspace_layout`, só precisa incluir os novos campos no objeto). |

### Estrutura do editor na LayoutPage

1. **Card: Cabeçalho** (já existe) - Logo + novo campo "Título do documento" (default: PROPOSTA COMERCIAL)
2. **Card: Rodapé** (já existe) - Nome, site, email
3. **Card: Títulos das Seções** - Campos para cada título de seção (Cliente, Briefing, Inclusões, Serviços, etc.) + campo de texto de validade
4. **Card: Termos e Condições** - 3 sub-blocos, cada um com: campo para o label (ex: "Responsabilidades da HERO:") e textarea para os itens (um por linha, com bullet)
5. **Card: Texto de Aprovação** - Textarea para o texto final antes das assinaturas

### Comportamento no PDF

Cada texto hardcoded atual será substituído por `layoutSettings?.campo || 'valor default'`, garantindo retrocompatibilidade total.

