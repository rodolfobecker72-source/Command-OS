import jsPDF from 'jspdf';
import { formatCurrency, formatCNPJ, formatPhone, BudgetVersion, ServiceItem } from '@/types/crm';

interface ContractPDFParams {
  template: string;
  budget: {
    proposalId: string;
    projectName: string;
    projectDescription: string;
    paymentTerms: string;
    hasExecutionDate: boolean;
    executionStartDate?: string | null;
    executionEndDate?: string | null;
    approvalDate?: string | null;
    finalValue?: number | null;
  };
  version: BudgetVersion;
  client: {
    companyName: string;
    cnpj: string;
    responsiblePerson: string;
    email: string;
    phone: string;
  };
  layout?: {
    companyName?: string;
    website?: string;
    email?: string;
    logoUrl?: string;
  } | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '___/___/______';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function buildServicesList(version: BudgetVersion): string {
  if (!version.services || version.services.length === 0) return 'Conforme proposta comercial anexa.';
  return version.services.map((s: ServiceItem, i: number) => {
    const objective = s.objective ? ` — ${s.objective}` : '';
    return `${i + 1}. ${s.serviceType}${objective}`;
  }).join('\n');
}

function buildExecutionDates(budget: ContractPDFParams['budget']): string {
  if (!budget.hasExecutionDate) return '';
  const start = formatDate(budget.executionStartDate);
  const end = formatDate(budget.executionEndDate);
  return `Início: ${start}\nTérmino: ${end}`;
}

export function generateContractPDF(params: ContractPDFParams) {
  const { template, budget, version, client, layout } = params;

  // Replace placeholders
  let text = template;
  const replacements: Record<string, string> = {
    '{{empresa_cliente}}': client.companyName || '',
    '{{cnpj}}': client.cnpj ? formatCNPJ(client.cnpj) : '',
    '{{responsavel}}': client.responsiblePerson || '',
    '{{email_cliente}}': client.email || '',
    '{{telefone_cliente}}': client.phone ? formatPhone(client.phone) : '',
    '{{empresa_contratada}}': layout?.companyName || '',
    '{{website_contratada}}': layout?.website || '',
    '{{email_contratada}}': layout?.email || '',
    '{{proposta_id}}': budget.proposalId || '',
    '{{nome_projeto}}': budget.projectName || '',
    '{{descricao_projeto}}': budget.projectDescription || '',
    '{{valor_total}}': budget.finalValue ? formatCurrency(budget.finalValue) : formatCurrency(version.fullPrice),
    '{{condicoes_pagamento}}': budget.paymentTerms || '',
    '{{datas_execucao}}': buildExecutionDates(budget),
    '{{data_aprovacao}}': formatDate(budget.approvalDate),
    '{{servicos}}': buildServicesList(version),
  };

  for (const [key, value] of Object.entries(replacements)) {
    text = text.replaceAll(key, value);
  }

  // Generate PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  const normalSize = 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(normalSize);

  const lines = text.split('\n');
  let y = margin;

  for (const rawLine of lines) {
    // Check if it's a title-like line (all caps or starts with CLÁUSULA)
    const isBold = /^(CONTRATO|CLÁUSULA|CONTRATANTE|CONTRATADA|___)/.test(rawLine.trim());
    
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const wrapped = doc.splitTextToSize(rawLine || ' ', contentWidth);
    
    for (const wLine of wrapped) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wLine, margin, y);
      y += lineHeight;
    }
  }

  const fileName = `Minuta_${budget.proposalId}_${client.companyName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
