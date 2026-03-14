import jsPDF from 'jspdf';
import {
  BudgetVersion,
  Budget,
  Client,
  OBJECTIVES_BY_SERVICE,
  formatCurrency,
  SERVICE_TYPE_LABELS,
} from '@/types/crm';
interface PDFUser {
  id: string;
  name: string;
  photo: string;
}
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDFGeneratorParams {
  budget: Budget;
  version: BudgetVersion;
  client: Client;
  responsibleUser: PDFUser | null;
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
}: PDFGeneratorParams): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Layout configuration
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const headerY = 15; // top margin for header area
  const contentStartY = 28; // where content begins (below header)
  const footerTopY = pageHeight - 28; // max Y before footer area
  
  // Colors (only black, gray, white)
  const black = [0, 0, 0] as [number, number, number];
  const darkGray = [80, 80, 80] as [number, number, number];
  const gray = [128, 128, 128] as [number, number, number];
  const lightGray = [200, 200, 200] as [number, number, number];
  
  // Font sizes
  const titleSize = 14;
  const subtitleSize = 12;
  const normalSize = 10;
  const smallSize = 9;
  
  // Project identification pattern: ID - Name - Version
  const projectIdentifier = `${budget.proposalId} - ${budget.projectName} - Versão ${version.version}`;
  const generatedDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  // Load logos
  let logoData: { base64: string; width: number; height: number } | null = null;
  try {
    logoData = await loadImageAsBase64('/images/hero-logo-black.png');
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

  // Helper functions
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
      const logoHeight = 8;
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
    doc.text(
      'HERO AUDIOVISUAL • www.hero.rec.br • comercial@hero.rec.br',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  /** If the next block of `neededHeight` won't fit, adds a new page and returns the new Y */
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
  // PAGE 1: Header, Client, Project, Inclusions
  // ============================================
  
  // First page header (logo + title, no duplicate)
  addHeader();
  
  doc.setFontSize(titleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('PROPOSTA COMERCIAL', margin, headerY + 4);
  
  y = contentStartY;
  
  // Project identifier
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  const identifierLines = doc.splitTextToSize(projectIdentifier, contentWidth - 50);
  doc.text(identifierLines, margin, y);
  y += identifierLines.length * 6 + 8;
  
  drawLine(y);
  y += 10;

  // CLIENT BLOCK — estimate height to keep together
  const clientBlockHeight = 8 + 6 * 3 + (responsibleUser ? 6 : 0) + 20;
  ensureSpace(clientBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('CLIENTE', margin, y);
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
    doc.text(`Atendimento HERO: ${responsibleUser.name}`, margin, y);
    y += 6;
  }
  
  y += 12;
  drawLine(y);
  y += 10;

  // PROJECT BLOCK
  const projectDescLines = budget.projectDescription ? doc.splitTextToSize(budget.projectDescription, contentWidth) as string[] : [];
  const projectBlockHeight = 8 + projectDescLines.length * 5 + 30;
  ensureSpace(projectBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('BRIEFING DO PROJETO', margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  
  if (projectDescLines.length > 0) {
    projectDescLines.forEach((line: string) => {
      doc.text(line, margin, y, { align: 'justify', maxWidth: contentWidth });
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
  
  doc.text('Validade: 30 dias', margin, y);
  y += 12;
  
  drawLine(y);
  y += 10;

  // INCLUSIONS BLOCK
  const inclusionItems = [
    { label: 'Impostos', included: budget.includesTax },
    { label: 'Logística e deslocamento', included: budget.includesLogistics },
    { label: 'Hospedagem da equipe', included: budget.includesAccommodation },
    { label: 'Alimentação da equipe', included: budget.includesMeals },
    { label: 'Material bruto', included: budget.includesRawMaterial },
    { label: 'Visita técnica', included: budget.includesTechnicalVisit },
  ];
  const inclusionsBlockHeight = 8 + inclusionItems.length * 6 + 4;
  ensureSpace(inclusionsBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('O QUE ESTÁ INCLUSO', margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');

  inclusionItems.forEach((item) => {
    const status = item.included ? '[x]' : '[ ]';
    setColor(item.included ? darkGray : gray);
    doc.text(`${status} ${item.label}`, margin, y);
    y += 6;
  });

  addFooter();

  // ============================================
  // PAGE 2: Services and Investments
  // ============================================
  
  doc.addPage();
  y = contentStartY;
  
  let totalProductionCost = 0;
  version.services.forEach(s => { totalProductionCost += s.costs.reduce((sum, c) => sum + c.value, 0); });

  // Pre-compute values needed for per-service pricing
  const preNfPct = version.nfCostPercentage || 13;
  const preMarginPct = version.margin || 0;
  const preOpTotal = (version.operationalCosts || []).reduce((sum, c) => sum + c.value, 0);
  const preTotalCosts = totalProductionCost + preOpTotal;
  const preDivisor = 1 - (preMarginPct / 100) - (preNfPct / 100);
  const preTotalProject = preDivisor > 0 ? preTotalCosts / preDivisor : preTotalCosts;
  const preNfValue = preTotalProject * (preNfPct / 100);
  const preMarginValue = preTotalProject - preTotalCosts - preNfValue;
  const preToDistribute = totalProductionCost + preMarginValue;

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('SERVIÇOS', margin, y);
  y += 10;

  version.services.forEach((service, serviceIndex) => {
    const objectives = OBJECTIVES_BY_SERVICE[service.serviceType];
    const objectiveLabel = objectives.find(o => o.value === service.objective)?.label || service.objective;
    const serviceProductionCost = service.costs.reduce((sum, c) => sum + c.value, 0);
    const serviceWeight = totalProductionCost > 0 ? serviceProductionCost / totalProductionCost : 0;
    const serviceDisplayValue = serviceWeight * preToDistribute;

    // Estimate block height: header(6) + objective(6) + desc + items + subtotal(16)
    const descLines = service.description ? doc.splitTextToSize(service.description, contentWidth - 10) as string[] : [];
    const estimatedHeight = 6 + 6 + descLines.length * 5 + 10 + service.costs.length * 8 + 20;
    
    // If the whole service fits, keep it together; otherwise just ensure minimum header space
    if (estimatedHeight < footerTopY - contentStartY) {
      ensureSpace(estimatedHeight);
    } else {
      ensureSpace(40); // at least header + objective + some items
    }
    
    // Service header
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`${serviceIndex + 1}. ${SERVICE_TYPE_LABELS[service.serviceType]}`, margin, y);
    y += 6;
    
    // Objective
    doc.setFontSize(smallSize);
    doc.setFont('helvetica', 'normal');
    setColor(gray);
    doc.text(`Objetivo: ${objectiveLabel}`, margin, y);
    y += 6;
    
    // Description
    if (descLines.length > 0) {
      doc.setFontSize(normalSize);
      setColor(darkGray);
      for (const line of descLines) {
        ensureSpace(6);
        doc.text(line, margin, y, { align: 'justify', maxWidth: contentWidth - 10 });
        y += 5;
      }
      y += 4;
    }
    
    // Items list
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
        
        doc.text(`${costIndex + 1}`, col1, y);
        doc.text(costDescLines, col2, y);
        y += itemHeight;
      });
    }
    
    // Service subtotal — keep with last item
    ensureSpace(16);
    y += 2;
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`Subtotal: ${formatCurrency(serviceDisplayValue)}`, pageWidth - margin, y, { align: 'right' });
    
    y += 16;
    
    // space between services
  });

  // ============================================
  // OPERATIONAL COSTS SECTION
  // ============================================
  const operationalCostItems = version.operationalCosts || [];
  let operationalTotal = 0;
  operationalCostItems.forEach(c => { operationalTotal += c.value; });
  
  if (operationalCostItems.length > 0) {
    // Estimate block height
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
    doc.text('DESPESAS OPERACIONAIS', margin, y);
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

  // INVESTMENT BREAKDOWN — keep as a block
  const investmentBlockHeight = 10 + version.services.length * 7 + (operationalTotal > 0 ? 7 : 0) + 7 + 20;
  ensureSpace(investmentBlockHeight);

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('COMPOSIÇÃO DO INVESTIMENTO', margin, y);
  y += 10;

  const versionNfPercentage = version.nfCostPercentage || 13;
  const versionFixedCostPct = version.fixedCostPercentage || 0;
  const versionMarginPct = version.margin || 0;

  const fixedCostValue = totalProductionCost * (versionFixedCostPct / 100);
  const totalCosts = totalProductionCost + fixedCostValue + operationalTotal;
  const divisor = 1 - (versionMarginPct / 100) - (versionNfPercentage / 100);
  const totalProjectValue = divisor > 0 ? totalCosts / divisor : totalCosts;
  const nfValue = totalProjectValue * (versionNfPercentage / 100);
  const marginValue = totalProjectValue - totalCosts - nfValue;
  const totalToDistribute = totalProductionCost + fixedCostValue + marginValue;

  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);

  version.services.forEach((service, idx) => {
    const serviceCost = service.costs.reduce((sum, c) => sum + c.value, 0);
    const weight = totalProductionCost > 0 ? serviceCost / totalProductionCost : 0;
    const serviceValue = weight * totalToDistribute;

    const label = `${idx + 1}. ${SERVICE_TYPE_LABELS[service.serviceType]}`;
    doc.text(label, margin, y);
    doc.text(formatCurrency(serviceValue), pageWidth - margin, y, { align: 'right' });
    y += 7;
  });

  if (operationalTotal > 0) {
    doc.text('Despesas Operacionais', margin, y);
    doc.text(formatCurrency(operationalTotal), pageWidth - margin, y, { align: 'right' });
    y += 7;
  }

  doc.text(`Nota Fiscal (${versionNfPercentage}%)`, margin, y);
  doc.text(formatCurrency(nfValue), pageWidth - margin, y, { align: 'right' });
  y += 6;
  drawLine(y);
  y += 10;

  // TOTAL
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('INVESTIMENTO TOTAL', margin, y);
  
  doc.setFontSize(titleSize);
  doc.text(formatCurrency(totalProjectValue), pageWidth - margin, y, { align: 'right' });
  
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
  doc.text('TERMOS E CONDIÇÕES', margin, y);
  y += 12;
  
  // HERO responsibilities
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  doc.text('Responsabilidades da HERO:', margin, y);
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  setColor(gray);
  
  const heroTerms = [
    '• Executar os serviços descritos com qualidade profissional',
    '• Fornecer equipe técnica qualificada',
    '• Cumprir os prazos acordados',
    '• Realizar até 2 rodadas de revisão',
  ];
  
  heroTerms.forEach((term) => {
    doc.text(term, margin, y);
    y += 6;
  });
  
  y += 8;
  
  // Client responsibilities
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  doc.text('Responsabilidades do Cliente:', margin, y);
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  setColor(gray);
  
  const clientTerms = [
    '• Fornecer acesso às locações e informações necessárias',
    '• Aprovar materiais dentro dos prazos combinados',
    '• Efetuar pagamentos conforme condições acordadas',
  ];
  
  clientTerms.forEach((term) => {
    doc.text(term, margin, y);
    y += 6;
  });
  
  y += 8;
  
  // General conditions
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  doc.text('Condições Gerais:', margin, y);
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  setColor(gray);
  
  const generalTerms = [
    '• Proposta válida por 30 dias',
    '• Alterações de escopo podem gerar custos adicionais',
    '• Cancelamento após início sujeito a cobrança proporcional',
  ];
  
  generalTerms.forEach((term) => {
    doc.text(term, margin, y);
    y += 6;
  });

  y += 20;
  
  // Approval text
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  doc.text('A aprovação desta proposta implica na aceitação dos termos acima.', margin, y);
  
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
  const safeProjectName = budget.projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const fileName = `${budget.proposalId}_${safeProjectName}_V${version.version}.pdf`;
  doc.save(fileName);
}
