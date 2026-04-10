//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import * as XLSX from 'xlsx';

export const generateExcelReport = (dashboardData, dataIntelligence, dashboardType = 'egg') => {
  const wb = XLSX.utils.book_new();
  const isRice = dashboardType === 'rice';
  const benchmarkLabel = isRice ? 'Rice Market Index (INR/kg)' : 'Namakkal Index (INR/egg)';
  const benchmarkValue = isRice ? dashboardData?.riceBenchmark : dashboardData?.namakkal;

  // Sheet 1: Top Importers
  const topImportersData = (dataIntelligence?.topImporters || []).map((imp, i) => ({
    'Rank': i + 1,
    'Importer Name': imp.name,
    'Total Volume': imp.volume,
    'Avg Unit Price': imp.avgPrice,
    'Last Shipment': imp.lastShipment,
    'Shipment Count': imp.shipmentCount || '-'
  }));
  if (topImportersData.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(topImportersData);
    ws1['!cols'] = [
      { wch: 6 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Top Importers');
  }

  // Sheet 2: Churn Registry
  const churnData = (dataIntelligence?.churnRegistry || []).map(imp => ({
    'Importer Name': imp.name,
    'Total Volume': imp.volume?.toLocaleString() || '-',
    'Shipment Count': imp.count || '-',
    'Last Seen': imp.lastSeen || '-',
    'Status': imp.count === 1 ? 'Single Shipment' : 'Inactive 90+ Days'
  }));
  if (churnData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(churnData);
    ws2['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Churn Registry');
  }

  // Sheet 3: Overpayers
  const overpayersData = (dataIntelligence?.overpayers || []).map(imp => ({
    'Importer Name': imp.name,
    'Avg Unit Price': imp.avgPrice,
    'Deviation Above Median': imp.deviation
  }));
  if (overpayersData.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(overpayersData);
    ws3['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Overpayers');
  }

  // Sheet 4: AI Summary
  const ai = dataIntelligence?.aiAnalysis;
  const summaryData = [
    { 'Field': benchmarkLabel, 'Value': benchmarkValue || '-' },
    { 'Field': 'AED/INR', 'Value': dashboardData?.rates?.aed_inr || '-' },
    { 'Field': 'USD/INR', 'Value': dashboardData?.rates?.usd_inr || '-' },
    { 'Field': 'EUR/INR', 'Value': dashboardData?.rates?.eur_inr || '-' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Importers Above Market Index', 'Value': ai?.priceAudit?.overMarketCount ?? '-' },
    { 'Field': 'Importers Below Market Index', 'Value': ai?.priceAudit?.underMarketCount ?? '-' },
    { 'Field': 'Price Audit Insight', 'Value': ai?.priceAudit?.insight || '-' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Inactive Partners (90D)', 'Value': ai?.churnStatus?.inactive30_90Days ?? '-' },
    { 'Field': 'Churn Commentary', 'Value': ai?.churnStatus?.commentary || '-' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Monetization Directive', 'Value': ai?.monetizationDirective || '-' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Report Generated', 'Value': new Date().toLocaleString() },
    { 'Field': 'Module', 'Value': isRice ? 'Rice Intelligence (HS 1006)' : 'Egg Executive Intelligence (HS 0407)' }
  ];
  const ws4 = XLSX.utils.json_to_sheet(summaryData);
  ws4['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'AI Summary');

  const filename = `NoorAlReef_${isRice ? 'Rice' : 'Egg'}_ProcessedData_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};
