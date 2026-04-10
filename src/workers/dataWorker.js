//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
// Web Worker for Data Compaction (70k+ records)
import * as XLSX from 'xlsx';

self.onmessage = async (e) => {
  const { file, action, hsCode } = e.data;

  if (action === 'PROCESS_DATA') {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      let jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Filter by HS code if provided
      if (hsCode) {
        const hs = String(hsCode);
        jsonData = jsonData.filter(row => {
          const rowHs = String(
            row['HS Code'] || row['HSCode'] || row['hs_code'] ||
            row['HS_CODE'] || row['HSCODE'] || row['Hs Code'] || ''
          );
          return rowHs.replace(/[^0-9]/g, '').startsWith(hs.replace(/[^0-9]/g, ''));
        });
      }

      // Filter for bulk importers (Quantity >= 100)
      const bulkData = jsonData.filter(row => {
        const qty = parseFloat(row.Quantity || row.Qty || row.QUANTITY || row.QTY || 0);
        return qty >= 100;
      });

      const importerMap = {};
      const dates = [];

      bulkData.forEach(row => {
        const importer = (
          row['Importer Name'] || row['IMPORTER NAME'] || row.Importer ||
          row.Consignee || row.CONSIGNEE || row.Buyer || row.BUYER || 'Unknown'
        ).trim();

        const qty = parseFloat(row.Quantity || row.Qty || row.QUANTITY || row.QTY || 0);
        const price = parseFloat(
          row['Unit Price'] || row['UNIT PRICE'] || row.Price ||
          row.UnitPrice || row.UNIT_PRICE || 0
        );
        const dateStr = row.Date || row.DATE || row['Shipment Date'] || row['SHIPMENT DATE'];

        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d)) dates.push(d);
        }

        if (!importerMap[importer]) {
          importerMap[importer] = { name: importer, volume: 0, totalValue: 0, count: 0, lastSeen: dateStr };
        }
        importerMap[importer].volume += qty;
        importerMap[importer].totalValue += qty * price;
        importerMap[importer].count += 1;

        if (dateStr) {
          const current = new Date(importerMap[importer].lastSeen);
          const incoming = new Date(dateStr);
          if (!isNaN(incoming) && incoming > current) {
            importerMap[importer].lastSeen = dateStr;
          }
        }
      });

      const processedImporters = Object.values(importerMap)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 50)
        .map(imp => ({
          name: imp.name,
          volume: imp.volume.toLocaleString(),
          avgPrice: imp.volume > 0 ? `$${(imp.totalValue / imp.volume).toFixed(3)}` : '$0.000',
          lastShipment: imp.lastSeen,
          shipmentCount: imp.count
        }));

      const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
      const churnThreshold = new Date(maxDate);
      churnThreshold.setMonth(maxDate.getMonth() - 3);

      // Churn: inactive for 3+ months OR only 1 shipment in entire dataset
      const churnRegistry = Object.values(importerMap)
        .filter(imp => {
          const lastDate = new Date(imp.lastSeen);
          return (!isNaN(lastDate) && lastDate < churnThreshold) || imp.count === 1;
        })
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      const allPrices = jsonData
        .map(r => parseFloat(r['Unit Price'] || r['UNIT PRICE'] || r.Price || 0))
        .filter(p => p > 0)
        .sort((a, b) => a - b);

      const medianPrice = allPrices.length > 0
        ? allPrices[Math.floor(allPrices.length / 2)]
        : 0.11;

      const overpayers = processedImporters
        .filter(imp => parseFloat(imp.avgPrice.replace('$', '')) > medianPrice * 1.15)
        .map(imp => ({
          name: imp.name,
          avgPrice: imp.avgPrice,
          deviation: `${(((parseFloat(imp.avgPrice.replace('$', '')) / medianPrice) - 1) * 100).toFixed(1)}%`
        }));

      self.postMessage({
        status: 'SUCCESS',
        compactedSignal: {
          topImporters: processedImporters,
          churnRegistry,
          overpayers,
          summary: `Dataset from ${maxDate.toLocaleDateString()} processed. ${jsonData.length} records compacted.`
        }
      });

    } catch (error) {
      self.postMessage({ status: 'ERROR', message: error.message });
    }
  }
};
