//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const groqRequest = async (apiKey, messages) => {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 2048 })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
};

const parseJSON = (raw) => {
  const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in Groq response');
  return JSON.parse(match[0]);
};

const cache = new Map();

export const analyzeNewsIntelligence = async (newsItems, dashboardType = 'egg') => {
  // Use 2-hour cache to avoid repeated AI calls for the same news set
  const cacheKey = `news_${dashboardType}_${newsItems.length}_${newsItems[0]?.id || ''}`;
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (Date.now() - entry.timestamp < 2 * 60 * 60 * 1000) return entry.data;
  }

  const keyEnv = dashboardType === 'rice'
    ? import.meta.env.VITE_GROQ_RICE_NEWS_KEY
    : import.meta.env.VITE_GROQ_EGG_NEWS_KEY;

  const isPlaceholder = !keyEnv || keyEnv.startsWith('placeholder');

  if (isPlaceholder) {
    return newsItems.map(item => ({
      ...item,
      aiImpact: item.aiImpact || 'HIGH RISK',
      aiAction: item.aiAction || 'Monitor closely and consult procurement team before committing to new orders.'
    }));
  }

  const hsCode = dashboardType === 'rice' ? '1006' : '0407';
  const commodity = dashboardType === 'rice' ? 'rice' : 'egg';

  // Truncate titles to absolute minimum for token savings
  const simplifiedNews = newsItems.map(n => ({ 
    id: n.id, 
    title: n.title.slice(0, 80), 
    source: n.source 
  }));

  const prompt = `You are a trade analyst for Noor AL Reef (HS ${hsCode}).
Analyze articles. Format: JSON array [{ "id": "...", "aiImpact": "...", "aiAction": "..." }]
Impact: CRITICAL, HIGH RISK, MODERATE, LOW, POSITIVE. 
Action: one specific sentence for a Dubai importer.
Articles: ${JSON.stringify(simplifiedNews)}`;

  try {
    const raw = await groqRequest(keyEnv, [{ role: 'user', content: prompt }]);
    const analyzed = parseJSON(raw);
    const result = newsItems.map(item => {
      const match = analyzed.find(a => a.id === item.id);
      return match ? { ...item, aiImpact: match.aiImpact, aiAction: match.aiAction } : item;
    });
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn('News analysis failed, using fallback:', err.message);
    return newsItems.map(item => ({
      ...item,
      aiImpact: item.aiImpact || 'MODERATE',
      aiAction: item.aiAction || 'Review market conditions before committing to procurement changes.'
    }));
  }
};

export const analyzeDataIntelligence = async (compactedSignal, currentMarketPrice, dashboardType = 'egg') => {
  const cacheKey = `data_${dashboardType}_${compactedSignal.summary || ''}_${currentMarketPrice}`;
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (Date.now() - entry.timestamp < 2 * 60 * 60 * 1000) return entry.data;
  }

  const keyEnv = dashboardType === 'rice'
    ? import.meta.env.VITE_GROQ_RICE_DATA_KEY
    : import.meta.env.VITE_GROQ_EGG_DATA_KEY;

  const isPlaceholder = !keyEnv || keyEnv.startsWith('placeholder');
  const marketPrice = parseFloat(String(currentMarketPrice).replace(/[^0-9.]/g, '')) || 0;
  const topImps = (compactedSignal.topImporters || []).slice(0, 20); // Limit to 20 for token safety

  if (isPlaceholder) {
    const overMarket = topImps.filter(imp => {
      const p = parseFloat(String(imp.avgPrice).replace(/[^0-9.]/g, '')) || 0;
      return dashboardType === 'egg' ? (p * 83 > marketPrice) : (p > marketPrice);
    }).length;
    return {
      priceAudit: { overMarketCount: overMarket, underMarketCount: topImps.length - overMarket, insight: `${overMarket} importers buying above index.` },
      churnStatus: { inactive30_90Days: compactedSignal.churnRegistry?.length || 0, commentary: 'Check inactive partners.' },
      monetizationDirective: `Contact ${overMarket} over-market importers with index-matched rates.`
    };
  }

  const commodity = dashboardType === 'rice' ? 'rice (1006)' : 'egg (0407)';
  const prompt = `Noor AL Reef ${commodity} Data. Index: ${currentMarketPrice}.
Top Importers: ${JSON.stringify(topImps)}.
Churn: ${JSON.stringify((compactedSignal.churnRegistry || []).slice(0, 5))}.
Return JSON: { "priceAudit": { "overMarketCount":0, "underMarketCount":0, "insight":"" }, "churnStatus": { "inactive30_90Days":0, "commentary":"" }, "monetizationDirective":"" }`;

  try {
    const raw = await groqRequest(keyEnv, [{ role: 'user', content: prompt }]);
    const result = parseJSON(raw);
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn('Data analysis fallback:', err.message);
    const over = topImps.filter(imp => (parseFloat(String(imp.avgPrice).replace(/[^0-9.]/g, '')) * 83) > marketPrice).length;
    return {
      priceAudit: { overMarketCount: over, underMarketCount: topImps.length - over, insight: `${over} importers above market.` },
      churnStatus: { inactive30_90Days: compactedSignal.churnRegistry?.length || 0, commentary: 'Review inactives.' },
      monetizationDirective: `Outreach to ${over} importers with matched pricing.`
    };
  }
};
