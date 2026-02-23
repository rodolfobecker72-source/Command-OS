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
  
  // Basic configuration
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors (only black, gray, white)
  const black = [0, 0, 0] as [number, number, number];
  const darkGray = [80, 80, 80] as [number, number, number];
  const gray = [128, 128, 128] as [number, number, number];
  const lightGray = [200, 200, 200] as [number, number, number];
  
  // Font sizes (Montserrat style using helvetica as base)
  const titleSize = 14;
  const subtitleSize = 12;
  const normalSize = 10;
  const smallSize = 9;
  
  // Project identification pattern: ID - Name - Version
  const projectIdentifier = `${budget.proposalId} - ${budget.projectName} - Versão ${version.version}`;
  const generatedDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  // Load logo
  let logoData: { base64: string; width: number; height: number } | null = null;
  try {
    logoData = await loadImageAsBase64('/images/hero-logo-black.png');
  } catch (error) {
    console.warn('Could not load logo:', error);
  }
  
  let y = margin;

  // Helper functions
  const setColor = (color: [number, number, number]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const drawLine = (yPos: number) => {
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(lightGray);
    doc.text(
      'HERO AUDIOVISUAL • www.hero.rec.br • comercial@hero.rec.br',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // ============================================
  // PAGE 1: Header, Client, Project, Inclusions
  // ============================================
  
  // HEADER with Logo
  // Logo on top right (subtle, maintaining original aspect ratio)
  if (logoData) {
    const logoHeight = 10;
    const aspectRatio = logoData.width / logoData.height;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoData.base64, 'PNG', pageWidth - margin - logoWidth, y - 3, logoWidth, logoHeight);
  }
  
  // Title on left
  doc.setFontSize(titleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('PROPOSTA COMERCIAL', margin, y);
  
  y += 10;
  
  // Project identifier (ID - Name - Version)
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(darkGray);
  const identifierLines = doc.splitTextToSize(projectIdentifier, contentWidth - 50);
  doc.text(identifierLines, margin, y);
  y += identifierLines.length * 6 + 8;
  
  drawLine(y);
  y += 12;

  // CLIENT BLOCK
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
  
  y += 8;
  drawLine(y);
  y += 12;

  // PROJECT BLOCK
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('PROJETO', margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);
  
  if (budget.projectDescription) {
    const descLines = doc.splitTextToSize(budget.projectDescription, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
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
  y += 12;

  // INCLUSIONS BLOCK
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('O QUE ESTÁ INCLUSO', margin, y);
  y += 8;
  
  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  
  const inclusions = [
    { label: 'Impostos', included: budget.includesTax },
    { label: 'Logística e deslocamento', included: budget.includesLogistics },
    { label: 'Hospedagem da equipe', included: budget.includesAccommodation },
    { label: 'Alimentação da equipe', included: budget.includesMeals },
    { label: 'Material bruto', included: budget.includesRawMaterial },
  ];

  inclusions.forEach((item) => {
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
  y = margin;
  
  let totalProductionCost = 0;

  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('SERVIÇOS', margin, y);
  y += 10;

  version.services.forEach((service, serviceIndex) => {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      addFooter();
      doc.addPage();
      y = margin;
    }
    
    const objectives = OBJECTIVES_BY_SERVICE[service.serviceType];
    const objectiveLabel = objectives.find(o => o.value === service.objective)?.label || service.objective;
    const serviceProductionCost = service.costs.reduce((sum, c) => sum + c.value, 0);
    totalProductionCost += serviceProductionCost;

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
    if (service.description) {
      doc.setFontSize(normalSize);
      setColor(darkGray);
      const descLines = doc.splitTextToSize(service.description, contentWidth - 10);
      doc.text(descLines, margin, y);
      y += descLines.length * 5 + 4;
    }
    
    // Items list
    if (service.costs.length > 0) {
      const col1 = margin;
      const col2 = margin + 10;
      
      doc.setFontSize(smallSize);
      doc.setFont('helvetica', 'bold');
      setColor(black);
      doc.text('#', col1, y);
      doc.text('Descrição', col2, y);
      y += 2;
      
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      
      doc.setFont('helvetica', 'normal');
      setColor(darkGray);
      
      service.costs.forEach((cost, costIndex) => {
        if (y > pageHeight - 40) {
          addFooter();
          doc.addPage();
          y = margin;
        }
        
        doc.text(`${costIndex + 1}`, col1, y);
        
        const maxDescWidth = contentWidth - 15;
        const descLines = doc.splitTextToSize(cost.description, maxDescWidth);
        doc.text(descLines, col2, y);
        
        y += descLines.length * 5 + 3;
      });
    }
    
    y += 8;
    
    // Separator between services
    if (serviceIndex < version.services.length - 1) {
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);
    }
  });

  // ============================================
  // OPERATIONAL COSTS SECTION
  // ============================================
  const operationalCostItems = version.operationalCosts || [];
  let operationalTotal = 0;
  operationalCostItems.forEach(c => { operationalTotal += c.value; });
  
  if (operationalCostItems.length > 0) {
    y += 6;
    
    if (y > pageHeight - 60) {
      addFooter();
      doc.addPage();
      y = margin;
    }
    
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
      if (y > pageHeight - 40) {
        addFooter();
        doc.addPage();
        y = margin;
      }
      
      doc.text(`${costIndex + 1}`, opCol1, y);
      
      const maxDescWidth = contentWidth - 15;
      const descLines = doc.splitTextToSize(cost.description, maxDescWidth);
      doc.text(descLines, opCol2, y);
      
      y += descLines.length * 5 + 3;
    });
    
    y += 4;
    
    doc.setFontSize(normalSize);
    doc.setFont('helvetica', 'bold');
    setColor(black);
    doc.text(`Subtotal: ${formatCurrency(operationalTotal)}`, pageWidth - margin, y, { align: 'right' });
    
    y += 8;
  }

  y += 10;
  drawLine(y);
  y += 12;

  // Check if we need a new page for the summary
  if (y > pageHeight - 80) {
    addFooter();
    doc.addPage();
    y = margin;
  }

  // INVESTMENT BREAKDOWN (new formula)
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

  doc.setFontSize(normalSize);
  doc.setFont('helvetica', 'normal');
  setColor(darkGray);

  // Custo de Produção
  doc.text('Custo de Produção', margin, y);
  doc.text(formatCurrency(totalProductionCost), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Custo Fixo
  doc.text(`Custo Fixo (${versionFixedCostPct}%)`, margin, y);
  doc.text(formatCurrency(fixedCostValue), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Despesas Operacionais
  if (operationalTotal > 0) {
    doc.text('Despesas Operacionais', margin, y);
    doc.text(formatCurrency(operationalTotal), pageWidth - margin, y, { align: 'right' });
    y += 7;
  }

  // Total dos Custos
  doc.setFont('helvetica', 'bold');
  doc.text('Total dos Custos', margin, y);
  doc.text(formatCurrency(totalCosts), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Margem
  doc.setFont('helvetica', 'normal');
  doc.text(`Margem (${versionMarginPct}%)`, margin, y);
  doc.text(formatCurrency(marginValue), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // NF
  doc.text(`Nota Fiscal (${versionNfPercentage}%)`, margin, y);
  doc.text(formatCurrency(nfValue), pageWidth - margin, y, { align: 'right' });
  y += 3;

  drawLine(y);
  y += 8;

  // TOTAL
  doc.setFontSize(subtitleSize);
  doc.setFont('helvetica', 'bold');
  setColor(black);
  doc.text('INVESTIMENTO TOTAL', margin, y);
  
  doc.setFontSize(titleSize);
  doc.text(formatCurrency(totalProjectValue), pageWidth - margin, y, { align: 'right' });
  
  addFooter();

  // ============================================
  // PAGE 3: Terms and Conditions
  // ============================================
  
  doc.addPage();
  y = margin;
  
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
  
  // Client signature
  doc.line(margin, y, margin + signatureWidth, y);
  doc.setFontSize(smallSize);
  setColor(gray);
  doc.text('Responsável', margin, y + 5);
  
  // Date
  doc.line(margin + signatureWidth + gap, y, margin + signatureWidth + gap + signatureWidth, y);
  doc.text('Data', margin + signatureWidth + gap, y + 5);

  addFooter();

  // Save with project identifier pattern
  const safeProjectName = budget.projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const fileName = `${budget.proposalId}_${safeProjectName}_V${version.version}.pdf`;
  doc.save(fileName);
}
