//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TEAL = [0, 104, 95];
const ORANGE = [225, 119, 38];
const BLACK = [0, 0, 0];
const GREY = [100, 100, 100];
const LIGHT_GREY = [200, 200, 200];
const MID_GREY = [150, 150, 150];

export const generateProfessionalPDF = async (data, mode, dashboardType = 'egg') => {
  try {
    const doc = new jsPDF();
    const isRice = dashboardType === 'rice';
    const hsCode = isRice ? 'HS 1006' : 'HS 0407';
    const commodityLabel = isRice ? 'Rice Intelligence' : 'Egg Executive Intelligence';
    const benchmarkLabel = isRice ? 'Rice Market Index Benchmark' : 'Namakkal Daily Index Benchmark';
    const benchmarkValue = isRice
      ? `INR ${data.riceBenchmark || '0.00'}/kg`
      : `INR ${data.namakkal || '0.00'}`;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(...TEAL);
    doc.text('Noor AL Reef Executive Intelligence', 15, 22);

    doc.setFontSize(10);
    doc.setTextColor(...MID_GREY);
    doc.text(`INTERNAL USE ONLY - STRICTLY CONFIDENTIAL - ${hsCode}`, 15, 30);

    doc.setFontSize(9);
    doc.setTextColor(...LIGHT_GREY);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 37);
    doc.text(`Module: ${commodityLabel}`, 15, 43);

    let yPos = 55;

    // --- Benchmark ---
    doc.setFontSize(13);
    doc.setTextColor(...BLACK);
    doc.text(`${benchmarkLabel}: ${benchmarkValue}`, 15, yPos);
    yPos += 8;

    if (data.rates) {
      doc.setFontSize(9);
      doc.setTextColor(...GREY);
      doc.text(
        `AED/INR: ${data.rates.aed_inr}   USD/INR: ${data.rates.usd_inr}   EUR/INR: ${data.rates.eur_inr || 'N/A'}`,
        15, yPos
      );
      yPos += 12;
    }

    if (mode === 'FULL') {
      doc.setFontSize(11);
      doc.setTextColor(...BLACK);
      doc.text('Performance Audit Summary:', 15, yPos);
      yPos += 8;

      if (data.dataIntelligence) {
        const di = data.dataIntelligence;
        doc.setFontSize(9);
        doc.setTextColor(...GREY);
        doc.text(`Price Audit: ${di.priceAudit?.overMarketCount || 0} importers above index, ${di.priceAudit?.underMarketCount || 0} below index.`, 15, yPos);
        yPos += 6;
        doc.text(`Inactive Partners (90D): ${di.churnStatus?.inactive30_90Days || 0}`, 15, yPos);
        yPos += 6;

        if (di.monetizationDirective) {
          const lines = doc.splitTextToSize(`Directive: ${di.monetizationDirective}`, 180);
          doc.setTextColor(...BLACK);
          doc.text(lines, 15, yPos);
          yPos += lines.length * 5 + 6;
        }
      }
    }

    // --- News Table ---
    doc.setFontSize(15);
    doc.setTextColor(...ORANGE);
    doc.text('Global Risk Monitoring Alert Summary', 15, yPos);
    yPos += 4;

    const newsData = (data.news || []).map(item => [
      item.source || '',
      item.title || '',
      item.aiImpact || '',
      item.aiAction || ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Executive Alert', 'Impact', 'Strategic Directive']],
      body: newsData,
      theme: 'grid',
      headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 60 },
        2: { cellWidth: 22 },
        3: { cellWidth: 70 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // --- Overpayers Table (FULL mode only) ---
    if (mode === 'FULL' && data.dataIntelligence?.overpayers?.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setTextColor(...TEAL);
      doc.text('Price Deviation Registry (Overpayers)', 15, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Importer', 'Avg Price', 'Deviation Above Index']],
        body: data.dataIntelligence.overpayers.map(o => [o.name, o.avgPrice, o.deviation]),
        theme: 'grid',
        headStyles: { fillColor: TEAL, textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // --- Director Signature ---
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text('Authorized by:', 15, yPos);

    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text('Vishnu Vardhan Nithyanandam', 15, yPos + 8);
    doc.text('DIRECTOR OF OPERATIONS', 15, yPos + 15);
    doc.text('Noor AL Reef General Trading LLC', 15, yPos + 22);

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_GREY);
    doc.text(
      '© Noor AL Reef General Trading LLC | Crafted by Raaya Global UG',
      105, 285, { align: 'center' }
    );

    const filename = `NoorAlReef_${isRice ? 'Rice' : 'Egg'}_Intelligence_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw err;
  }
};
