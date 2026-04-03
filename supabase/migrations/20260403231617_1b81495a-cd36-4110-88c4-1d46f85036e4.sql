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