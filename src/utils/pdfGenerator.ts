import jsPDF from 'jspdf';
import {
  BudgetVersion,
  Budget,
  Client,
  OBJECTIVES_BY_SERVICE,
  formatCurrency,
  SERVICE_TYPE_LABELS,
  DELIVERY_TYPE_LABELS,
  DeliveryType,
} from '@/types/crm';
interface PDFUser {
  id: string;
  name: string;
  photo: string;
}
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PDFLayoutSettings {
  logoUrl: string;
  companyName: string;
  website: string;
  email: string;
  pdfTitle?: string;
  sectionClientTitle?: string;
  sectionBriefingTitle?: string;
  sectionInclusionsTitle?: string;
  sectionServicesTitle?: string;
  sectionOperationalTitle?: string;
  sectionInvestmentTitle?: string;
  sectionTotalTitle?: string;
  sectionTermsTitle?: string;
  termsCompanyLabel?: string;
  termsCompanyItems?: string;
  termsClientLabel?: string;
  termsClientItems?: string;
  termsGeneralLabel?: string;
  termsGeneralItems?: string;
  termsApprovalText?: string;
  validityText?: string;
}

interface PDFGeneratorParams {
  budget: Budget;
  version: BudgetVersion;
  client: Client;
  responsibleUser: PDFUser | null;
  layoutSettings?: PDFLayoutSettings | null;
  categoryLabels?: Record<string, string>;
  objectiveLabels?: Record<string, Record<string, string>>;
}

// Helper function to load image as base64 with dimensions
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
        resolve({
          base64: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height
        });
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateProposalPDF({
  budget,
  version,
  client,
  responsibleUser,
  layoutSettings,
  categoryLabels: catLabels,
  objectiveLabels: objLabels,
  existingDoc,
  skipSave,
}: PDFGeneratorParams & { existingDoc?: jsPDF; skipSave?: boolean }): Promise<jsPDF> {
  const catLookup = catLabels || {};
  const objLookup = objLabels || {};
  const doc = existingDoc || new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const headerY = 15;
  const contentStartY = 28;
  const footerTopY = pageHeight - 28;
  
  const black = [0, 0, 0] as [number, number, number];
  const darkGray = [80, 80, 80] as [number, number, number];
  const gray = [128, 128, 128] as [number, number, number];
  const lightGray = [200, 200, 200] as [number, number, number];
  
  const titleSize = 14;
  const subtitleSize = 12;
  const normalSize = 10;
  const smallSize = 9;

  // Configurable texts with fallbacks
  const t = {
    pdfTitle: layoutSettings?.pdfTitle || 'PROPOSTA COMERCIAL',
    client: layoutSettings?.sectionClientTitle || 'CLIENTE',
    briefing: layoutSettings?.sectionBriefingTitle || 'BRIEFING DO PROJETO',
    
    services: layoutSettings?.sectionServicesTitle || 'SERVIÇOS',
    operational: layoutSettings?.sectionOperationalTitle || 'DESPESAS OPERACIONAIS',
    investment: layoutSettings?.sectionInvestmentTitle || 'COMPOSIÇÃO DO INVESTIMENTO',
    total: layoutSettings?.sectionTotalTitle || 'INVESTIMENTO TOTAL',
    terms: layoutSettings?.sectionTermsTitle || 'TERMOS E CONDIÇÕES',
    termsCompanyLabel: layoutSettings?.termsCompanyLabel || 'Responsabilidades da HERO:',
    termsCompanyItems: layoutSettings?.termsCompanyItems || '• Executar os serviços descritos com qualidade profissional\n• Fornecer equipe técnica qualificada\n• Cumprir os prazos acordados\n• Realizar até 2 rodadas de revisão',
    termsClientLabel: layoutSettings?.termsClientLabel || 'Responsabilidades do Cliente:',
    termsClientItems: layoutSettings?.termsClientItems || '• Fornecer acesso às locações e informações necessárias\n• Aprovar materiais dentro dos prazos combinados\n• Efetuar pagamentos conforme condições acordadas',
    termsGeneralLabel: layoutSettings?.termsGeneralLabel || 'Condições Gerais:',
    termsGeneralItems: layoutSettings?.termsGeneralItems || '• Proposta válida por 30 dias\n• Alterações de escopo podem gerar custos adicionais\n• Cancelamento após início sujeito a cobrança proporcional',
    termsApproval: layoutSettings?.termsApprovalText || 'A aprovação desta proposta implica na aceitação dos termos acima.',
    validity: layoutSettings?.validityText || 'Validade: 30 dias',
  };
  
  const projectIdentifier = `${budget.proposalId} - ${budget.projectName} - Versão ${version.version}`;
  const generatedDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
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
  
  let y = contentStartY;

  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const drawLine = (yPos: number) => {
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

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
    setColor(lightGray);
    const footerParts: string[] = [];
    if (layoutSettings?.companyName) footerParts.push(layoutSettings.companyName.toUpperCase());
    if (layoutSettings?.website) footerParts.push(layoutSettings.website);
    if (layoutSettings?.email) footerParts.push(layoutSettings.email);
    const footerText = footerParts.length > 0
      ? footerParts.join(' • ')
      : 'HERO AUDIOVISUAL • www.hero.rec.br • comercial@hero.rec.br';
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const ensureSpace = (neededHeight: number): number => {
    if (y + neededHeight > footerTopY) {
      addHeader();
      addFooter();
      doc.addPage();
      y = contentStartY;
    }
    return y;
  };

  const newPage = () => {
    addHeader();
    addFooter();
    doc.addPage();
    y = contentStartY;
  };

  // ============================================
  // PAGE 1
  // ============================================
  addHeader();
  
  doc.setFontSize(titleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.pdfTitle, margin, headerY + 4);
  
  y = contentStartY;
  
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  const identifierLines = doc.splitTextToSize(projectIdentifier, contentWidth - 50);
  doc.text(identifierLines, margin, y);
  y += identifierLines.length * 6 + 8;
  
  drawLine(y);
  y += 10;

  // CLIENT BLOCK
  const clientBlockHeight = 8 + 6 * 3 + (responsibleUser ? 6 : 0) + 20;
  ensureSpace(clientBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.client, margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  
  doc.text(`Empresa: ${client.companyName}`, margin, y);
  y += 6;
  doc.text(`Responsável: ${client.responsiblePerson}`, margin, y);
  y += 6;
  doc.text(`Data da Proposta: ${generatedDate}`, margin, y);
  y += 6;
  
  if (responsibleUser) {
    doc.text(`Responsável pelo atendimento: ${responsibleUser.name}`, margin, y);
    y += 6;
  }
  
  y += 12;
  drawLine(y);
  y += 10;

  // PROJECT BLOCK
  const projectDescForHeight = budget.projectDescription ? doc.splitTextToSize(budget.projectDescription, contentWidth) as string[] : [];
  const projectBlockHeight = 8 + projectDescForHeight.length * 5 + 30;
  ensureSpace(projectBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.briefing, margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  
  if (budget.projectDescription) {
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'normal');
    setColor(darkGray);
    const briefLines = doc.splitTextToSize(budget.projectDescription, contentWidth) as string[];
    briefLines.forEach((line: string, idx: number) => {
      ensureSpace(6);
      if (idx < briefLines.length - 1) {
        doc.text(line, margin, y, { align: 'justify', maxWidth: contentWidth });
      } else {
        doc.text(line, margin, y);
      }
      y += 5;
    });
    y += 4;
  }
  
  if (budget.location) {
    doc.text(`Local: ${budget.location}`, margin, y);
    y += 6;
  }
  
  if (budget.hasExecutionDate && budget.executionStartDate) {
    const startDate = format(new Date(budget.executionStartDate), "dd/MM/yyyy", { locale: ptBR });
    if (budget.executionEndDate) {
      const endDate = format(new Date(budget.executionEndDate), "dd/MM/yyyy", { locale: ptBR });
      doc.text(`Período: ${startDate} a ${endDate}`, margin, y);
    } else {
      doc.text(`Data: ${startDate}`, margin, y);
    }
    y += 6;
  }
  
  if (budget.paymentTerms) {
    doc.text(`Pagamento: ${budget.paymentTerms}`, margin, y);
    y += 6;
  }
  
  doc.text(t.validity, margin, y);
  y += 12;
  
  drawLine(y);
  y += 10;

  addFooter();

  // ============================================
  // PAGE 2: Services and Investments
  // ============================================
  
  doc.addPage();
  y = contentStartY;
  
  let totalProductionCost = 0;
  version.services.forEach(s => { totalProductionCost += s.costs.reduce((sum, c) => sum + c.value, 0); });

  const hideNf = !!budget.hideNfInPdf;
  const hideOp = !!budget.hideOperationalInPdf;
  const hideNfObs = !!budget.hideNfObservationInPdf;
  const preNfPct = version.nfCostPercentage || 13;
  const preMarginPct = version.margin || 0;
  const preOpTotal = (version.operationalCosts || []).reduce((sum, c) => sum + c.value, 0);
  const preTotalCosts = totalProductionCost + preOpTotal;
  const preDivisor = 1 - (preMarginPct / 100) - (preNfPct / 100);
  const preTotalProject = preDivisor > 0 ? preTotalCosts / preDivisor : preTotalCosts;
  const preNfValue = preTotalProject * (preNfPct / 100);
  const preMarginValue = preTotalProject - preTotalCosts - preNfValue;
  // When hiding NF/Operacional in the PDF, distribute its value proportionally into services
  const preToDistribute = totalProductionCost + preMarginValue + (hideNf ? preNfValue : 0) + (hideOp ? preOpTotal : 0);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.services, margin, y);
  y += 10;

  version.services.forEach((service, serviceIndex) => {
    const objectives = OBJECTIVES_BY_SERVICE[service.serviceType] || [];
    const objectiveLabel = objectives.find(o => o.value === service.objective)?.label || service.objective;
    const serviceProductionCost = service.costs.reduce((sum, c) => sum + c.value, 0);
    const serviceWeight = totalProductionCost > 0 ? serviceProductionCost / totalProductionCost : 0;
    const serviceDisplayValue = serviceWeight * preToDistribute;

    // Split description with correct font metrics
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'normal');
    const descLines = service.description ? doc.splitTextToSize(service.description, contentWidth) as string[] : [];
    const estimatedHeight = 6 + 6 + descLines.length * 5 + 10 + service.costs.length * 8 + 20;
    
    if (estimatedHeight < footerTopY - contentStartY) {
      ensureSpace(estimatedHeight);
    } else {
      ensureSpace(40);
    }
    
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`${serviceIndex + 1}. ${catLookup[service.serviceType] || SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType}`, margin, y);
    y += 6;
    
    doc.setFontSize(smallSize);
    doc.setFont('helvetica', 'normal');
    setColor(gray);
    doc.text(`Objetivo: ${objectiveLabel}`, margin, y);
    y += 6;

    // Prazo de entrega
    if (service.deliveryType) {
      let deliveryText = '';
      if (service.deliveryType === 'realtime') {
        deliveryText = 'Prazo de entrega: Real time (mesmo dia)';
      } else if (service.deliveryType === 'dias_uteis') {
        deliveryText = `Prazo de entrega: ${service.deliveryDays || ''} dias úteis`;
      } else if (service.deliveryType === 'dias_corridos') {
        deliveryText = `Prazo de entrega: ${service.deliveryDays || ''} dias corridos`;
      } else if (service.deliveryType === 'data_especifica' && (service as any).deliveryDate) {
        const d = new Date((service as any).deliveryDate + 'T12:00:00');
        deliveryText = `Prazo de entrega: ${d.toLocaleDateString('pt-BR')}`;
      }
      if (deliveryText) {
        doc.text(deliveryText, margin, y);
        y += 6;
      }
    }
    
    if (descLines.length > 0) {
      doc.setFontSize(normalSize);
      doc.setFont('helvetica', 'normal');
      setColor(darkGray);
      descLines.forEach((line: string, idx: number) => {
        ensureSpace(6);
        doc.setFontSize(normalSize);
        doc.setFont('helvetica', 'normal');
        setColor(darkGray);
        if (idx < descLines.length - 1) {
          doc.text(line, margin, y, { align: 'justify', maxWidth: contentWidth });
        } else {
          doc.text(line, margin, y);
        }
        y += 5;
      });
      y += 4;
    }
    
    if (service.costs.length > 0) {
      const col1 = margin;
      const col2 = margin + 10;
      
      ensureSpace(12);
      doc.setFontSize(smallSize);
      doc.setFont('helvetica', 'bold');
      setColor(black);
      doc.text('#', col1, y);
      doc.text('Descrição', col2, y);
      y += 2;
      y += 4;
      
      doc.setFont('helvetica', 'normal');
      setColor(darkGray);
      
      service.costs.forEach((cost, costIndex) => {
        const costDescLines = doc.splitTextToSize(cost.description, contentWidth - 15);
        const itemHeight = costDescLines.length * 5 + 3;
        ensureSpace(itemHeight);
        doc.setFontSize(smallSize);
        doc.setFont('helvetica', 'normal');
        setColor(darkGray);
        
        doc.text(`${costIndex + 1}`, col1, y);
        doc.text(costDescLines, col2, y);
        y += itemHeight;
      });
    }
    
    ensureSpace(16);
    y += 2;
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`Subtotal: ${formatCurrency(serviceDisplayValue)}`, pageWidth - margin, y, { align: 'right' });
    y += 16;
  });

  // OPERATIONAL COSTS
  const operationalCostItems = version.operationalCosts || [];
  let operationalTotal = 0;
  operationalCostItems.forEach(c => { operationalTotal += c.value; });
  
  if (operationalCostItems.length > 0 && !hideOp) {
    const opBlockHeight = 10 + 10 + operationalCostItems.length * 8 + 16;
    if (opBlockHeight < footerTopY - contentStartY) {
      ensureSpace(opBlockHeight);
    } else {
      ensureSpace(30);
    }
    
    y += 6;
    
    doc.setFontSize(subtitleSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(t.operational, margin, y);
    y += 10;
    
    const opCol1 = margin;
    const opCol2 = margin + 10;
    
    doc.setFontSize(smallSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text('#', opCol1, y);
    doc.text('Descrição', opCol2, y);
    y += 2;
    
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    setColor(darkGray);
    
    operationalCostItems.forEach((cost, costIndex) => {
      const costDescLines = doc.splitTextToSize(cost.description, contentWidth - 15);
      const itemHeight = costDescLines.length * 5 + 3;
      ensureSpace(itemHeight);
      doc.setFontSize(smallSize);
      doc.setFont('helvetica', 'normal');
      setColor(darkGray);
      
      doc.text(`${costIndex + 1}`, opCol1, y);
      doc.text(costDescLines, opCol2, y);
      y += itemHeight;
    });
    
    ensureSpace(12);
    y += 4;
    
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`Subtotal: ${formatCurrency(operationalTotal)}`, pageWidth - margin, y, { align: 'right' });
    y += 8;
  }

  drawLine(y);
  y += 12;

  // INVESTMENT BREAKDOWN
  const investmentBlockHeight = 10 + version.services.length * 7 + (operationalTotal > 0 ? 7 : 0) + 7 + 20;
  ensureSpace(investmentBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.investment, margin, y);
  y += 10;

  const versionNfPercentage = version.nfCostPercentage || 13;
  const versionMarginPct = version.margin || 0;

  const totalCosts = totalProductionCost + operationalTotal;
  const divisor = 1 - (versionMarginPct / 100) - (versionNfPercentage / 100);
  const totalProjectValue = divisor > 0 ? totalCosts / divisor : totalCosts;
  const nfValue = totalProjectValue * (versionNfPercentage / 100);
  const marginValue = totalProjectValue - totalCosts - nfValue;
  const totalToDistribute = totalProductionCost + marginValue + (hideNf ? nfValue : 0) + (hideOp ? operationalTotal : 0);

  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);

  version.services.forEach((service, idx) => {
    const serviceCost = service.costs.reduce((sum, c) => sum + c.value, 0);
    const weight = totalProductionCost > 0 ? serviceCost / totalProductionCost : 0;
    const serviceValue = weight * totalToDistribute;

    const objectives = OBJECTIVES_BY_SERVICE[service.serviceType] || [];
    const objLabel = objLookup[service.serviceType]?.[service.objective] || objectives?.find(o => o.value === service.objective)?.label || service.objective || '';
    const label = `${idx + 1}. ${catLookup[service.serviceType] || SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType}${objLabel ? ` — ${objLabel}` : ''}`;
    doc.text(label, margin, y);
    doc.text(formatCurrency(serviceValue), pageWidth - margin, y, { align: 'right' });
    y += 7;
  });

  if (operationalTotal > 0 && !hideOp) {
    doc.text('Despesas Operacionais', margin, y);
    doc.text(formatCurrency(operationalTotal), pageWidth - margin, y, { align: 'right' });
    y += 7;
  }

  if (!hideNf) {
    doc.text(`Nota Fiscal (${versionNfPercentage}%)`, margin, y);
    doc.text(formatCurrency(nfValue), pageWidth - margin, y, { align: 'right' });
    y += 6;
  }
  drawLine(y);
  y += 10;

  // TOTAL
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.total, margin, y);
  
  doc.setFontSize(titleSize);
  doc.text(formatCurrency(totalProjectValue), pageWidth - margin, y, { align: 'right' });

  // Observação sobre faturamento / Nota Fiscal
  if (!hideNfObs) {
    y += 14;
    const obsTitle = 'Observação sobre faturamento — Emissão de Nota Fiscal';
    const companyName = (layoutSettings?.companyName || 'HERO').toUpperCase();
    const obsBody = `A emissão de Nota Fiscal é obrigatória para esta proposta. Os valores apresentados já consideram a tributação incidente sobre o serviço prestado, de acordo com a alíquota vigente da ${companyName}.`;

    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'normal');
    const bodyLines = doc.splitTextToSize(obsBody, contentWidth - 10) as string[];
    const boxPadding = 5;
    const titleLineH = 6;
    const bodyLineH = 5.5;
    const boxHeight = boxPadding * 2 + titleLineH + 3 + bodyLines.length * bodyLineH;

    ensureSpace(boxHeight + 4);

    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setFillColor(248, 248, 248);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    let ty = y + boxPadding + 4;
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(obsTitle, margin + boxPadding, ty);
    ty += titleLineH + 3;

    doc.setFont('helvetica', 'normal');
    setColor(darkGray);
    bodyLines.forEach((line) => {
      doc.text(line, margin + boxPadding, ty);
      ty += bodyLineH;
    });

    y += boxHeight;
  }

  addHeader();
  addFooter();

  // ============================================
  // PAGE 3: Terms and Conditions
  // ============================================
  
  doc.addPage();
  y = contentStartY;
  
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text(t.terms, margin, y);
  y += 12;

  // Helper to render a terms block
  const renderTermsBlock = (label: string, itemsText: string) => {
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(darkGray);
    doc.text(label, margin, y);
    y += 7;
    
    doc.setFont('helvetica', 'normal');
    setColor(gray);
    
    const items = itemsText.split('\n').filter(line => line.trim());
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentWidth) as string[];
      lines.forEach(line => {
        ensureSpace(6);
        doc.text(line, margin, y);
        y += 6;
      });
    });
    y += 8;
  };

  renderTermsBlock(t.termsCompanyLabel, t.termsCompanyItems);
  renderTermsBlock(t.termsClientLabel, t.termsClientItems);
  renderTermsBlock(t.termsGeneralLabel, t.termsGeneralItems);

  y += 12;
  
  // Approval text
  ensureSpace(30);
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  const approvalLines = doc.splitTextToSize(t.termsApproval, contentWidth) as string[];
  approvalLines.forEach(line => {
    doc.text(line, margin, y);
    y += 6;
  });
  
  y += 25;
  
  // Signature lines
  const signatureWidth = 70;
  const gap = 20;
  
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.5);
  
  doc.line(margin, y, margin + signatureWidth, y);
  doc.setFontSize(smallSize);
  setColor(gray);
  doc.text('Responsável', margin, y + 5);
  
  doc.line(margin + signatureWidth + gap, y, margin + signatureWidth + gap + signatureWidth, y);
  doc.text('Data', margin + signatureWidth + gap, y + 5);

  addHeader();
  addFooter();

  // Save
  if (!skipSave) {
    const safeProjectName = budget.projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `${budget.proposalId}_${safeProjectName}_V${version.version}.pdf`;
    doc.save(fileName);
  }
  return doc;
}
