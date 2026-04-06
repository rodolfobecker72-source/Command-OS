import jsPDF from 'jspdf';
import { formatCurrency, formatCNPJ, formatPhone, BudgetVersion, ServiceItem, Budget, Client } from '@/types/crm';
import { generateProposalPDF, PDFLayoutSettings } from '@/utils/pdfGenerator';

interface ContractPDFParams {
  template: string;
  budget: Budget;
  version: BudgetVersion;
  client: Client;
  layoutSettings?: PDFLayoutSettings | null;
  responsibleUser?: { id: string; name: string; photo: string } | null;
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '___/___/______';
  try {
    const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(dateStr);
  }
}

function buildServicesList(version: BudgetVersion): string {
  if (!version.services || version.services.length === 0) return 'Conforme proposta comercial anexa.';
  return version.services.map((s: ServiceItem, i: number) => {
    const objective = s.objective ? ` — ${s.objective}` : '';
    return `${i + 1}. ${s.serviceType}${objective}`;
  }).join('\n');
}

function buildExecutionDates(budget: Budget): string {
  if (!budget.hasExecutionDate) return '';
  const start = formatDate(budget.executionStartDate);
  const end = formatDate(budget.executionEndDate);
  return `Início: ${start}\nTérmino: ${end}`;
}

async function loadImageAsBase64(url: string): Promise<{ base64: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({ base64: canvas.toDataURL('image/png'), width: img.width, height: img.height });
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateContractPDF(params: ContractPDFParams) {
  const { template, budget, version, client, layoutSettings, responsibleUser } = params;

  // Replace placeholders
  let text = template;
  const replacements: Record<string, string> = {
    '{{empresa_cliente}}': client.companyName || '',
    '{{cnpj}}': client.cnpj ? formatCNPJ(client.cnpj) : '',
    '{{responsavel}}': client.responsiblePerson || '',
    '{{email_cliente}}': client.email || '',
    '{{telefone_cliente}}': client.phone ? formatPhone(client.phone) : '',
    '{{empresa_contratada}}': layoutSettings?.companyName || '',
    '{{website_contratada}}': layoutSettings?.website || '',
    '{{email_contratada}}': layoutSettings?.email || '',
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
    text = text.split(key).join(value);
  }

  // Generate PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  const normalSize = 11;
  const headerY = 15;
  const contentStartY = 28;
  const footerTopY = pageHeight - 28;

  const lightGray = [200, 200, 200] as [number, number, number];

  // Load logos
  let logoData: { base64: string; width: number; height: number } | null = null;
  const headerLogoUrl = layoutSettings?.logoUrl || '/images/hero-logo-black.png';
  try {
    logoData = await loadImageAsBase64(headerLogoUrl);
  } catch (error) {
    console.warn('Could not load logo:', error);
  }

  let footerLogoData: { base64: string; width: number; height: number } | null = null;
  try {
    const { default: commandLogoUrl } = await import('@/assets/command-logo.png');
    footerLogoData = await loadImageAsBase64(commandLogoUrl);
  } catch (error) {
    console.warn('Could not load footer logo:', error);
  }

  const addHeader = () => {
    if (logoData) {
      const logoHeight = 20;
      const aspectRatio = logoData.width / logoData.height;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoData.base64, 'PNG', pageWidth - margin - logoWidth, headerY - 2, logoWidth, logoHeight);
    }
  };

  const addFooter = () => {
    if (footerLogoData) {
      const fLogoH = 6;
      const fAspect = footerLogoData.width / footerLogoData.height;
      const fLogoW = fLogoH * fAspect;
      doc.addImage(footerLogoData.base64, 'PNG', pageWidth / 2 - fLogoW / 2, pageHeight - 20, fLogoW, fLogoH);
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    const footerParts: string[] = [];
    if (layoutSettings?.companyName) footerParts.push(layoutSettings.companyName.toUpperCase());
    if (layoutSettings?.website) footerParts.push(layoutSettings.website);
    if (layoutSettings?.email) footerParts.push(layoutSettings.email);
    const footerText = footerParts.length > 0
      ? footerParts.join(' • ')
      : '';
    if (footerText) {
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };

  let y = contentStartY;

  // Track current font state to restore after page breaks
  let currentFont: 'normal' | 'bold' = 'normal';

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > footerTopY) {
      addHeader();
      addFooter();
      doc.addPage();
      y = contentStartY;
      // Restore font state after page break (addFooter changes it)
      doc.setFont('helvetica', currentFont);
      doc.setFontSize(normalSize);
      doc.setTextColor(0, 0, 0);
    }
  };

  // Add header to first page
  addHeader();

  // Render contract text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(normalSize);
  doc.setTextColor(0, 0, 0);

  const lines = text.split('\n');

  for (const rawLine of lines) {
    const isBold = /^(CONTRATO|CLÁUSULA|CONTRATANTE|CONTRATADA|___)/.test(rawLine.trim());

    if (isBold) {
      currentFont = 'bold';
      doc.setFont('helvetica', 'bold');
    } else {
      currentFont = 'normal';
      doc.setFont('helvetica', 'normal');
    }

    doc.setFontSize(normalSize);
    doc.setTextColor(0, 0, 0);

    const wrapped = doc.splitTextToSize(rawLine || ' ', contentWidth) as string[];

    for (let i = 0; i < wrapped.length; i++) {
      ensureSpace(lineHeight);
      // Justify text (except last line of paragraph and bold titles)
      if (!isBold && wrapped.length > 1 && i < wrapped.length - 1) {
        doc.text(wrapped[i], margin, y, { align: 'justify', maxWidth: contentWidth });
      } else {
        doc.text(wrapped[i], margin, y);
      }
      y += lineHeight;
    }
  }

  // Finalize last contract page
  addHeader();
  addFooter();

  // ============================================
  // APPEND PROPOSAL PDF
  // ============================================
  doc.addPage();

  await generateProposalPDF({
    budget,
    version,
    client,
    responsibleUser: responsibleUser || null,
    layoutSettings,
    existingDoc: doc,
    skipSave: true,
  });

  // Save combined PDF
  const safeProjectName = budget.projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const fileName = `Contrato_Proposta_${budget.proposalId}_${safeProjectName}.pdf`;
  doc.save(fileName);
}
