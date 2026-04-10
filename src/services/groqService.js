//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-8b-8192';

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

export const analyzeNewsIntelligence = async (newsItems, dashboardType = 'egg') => {
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

  const prompt = `You are an executive trade intelligence analyst for Noor AL Reef General Trading LLC, a Dubai-based importer of ${commodity} (HS ${hsCode}).

Analyze the following news articles. For each article, provide:
1. aiImpact: One of: CRITICAL, HIGH RISK, HIGH NEGATIVE, MODERATE, LOW, POSITIVE
2. aiAction: A specific one-sentence operational directive for a Dubai-based importer. No EM dashes.

Articles:
${JSON.stringify(newsItems.map(n => ({ id: n.id, title: n.title, source: n.source })))}

Respond ONLY with a JSON array: [{ "id": "...", "aiImpact": "...", "aiAction": "..." }]`;

  try {
    const raw = await groqRequest(keyEnv, [{ role: 'user', content: prompt }]);
    const analyzed = parseJSON(raw);
    return newsItems.map(item => {
      const match = analyzed.find(a => a.id === item.id);
      return match ? { ...item, aiImpact: match.aiImpact, aiAction: match.aiAction } : item;
    });
  } catch (err) {
    console.error('News analysis failed:', err);
    return newsItems.map(item => ({
      ...item,
      aiImpact: item.aiImpact || 'MODERATE',
      aiAction: item.aiAction || 'Review market conditions before committing to procurement changes.'
    }));
  }
};

export const analyzeDataIntelligence = async (compactedSignal, currentMarketPrice, dashboardType = 'egg') => {
  const keyEnv = dashboardType === 'rice'
    ? import.meta.env.VITE_GROQ_RICE_DATA_KEY
    : import.meta.env.VITE_GROQ_EGG_DATA_KEY;

  const isPlaceholder = !keyEnv || keyEnv.startsWith('placeholder');

  const marketPrice = parseFloat(String(currentMarketPrice).replace(/[^0-9.]/g, '')) || 0;
  const topImporters = compactedSignal.topImporters || [];

  if (isPlaceholder) {
    const overMarket = topImporters.filter(imp => {
      const p = parseFloat(String(imp.avgPrice).replace(/[^0-9.]/g, '')) || 0;
      return dashboardType === 'egg' ? (p * 83 > marketPrice) : (p > marketPrice);
    }).length;
    return {
      priceAudit: {
        overMarketCount: overMarket,
        underMarketCount: topImporters.length - overMarket,
        insight: `${overMarket} importers are buying above the current market index.`
      },
      churnStatus: {
        inactive30_90Days: compactedSignal.churnRegistry?.length || 0,
        commentary: 'Review inactive partners for re-engagement opportunities.'
      },
      monetizationDirective: `Contact the ${overMarket} over-market importers with a competitive rate matching the current index to convert volume.`
    };
  }

  const commodity = dashboardType === 'rice' ? 'rice (HS 1006)' : 'egg (HS 0407)';
  const benchmark = dashboardType === 'rice' ? 'Rice Market Index' : 'NECC Namakkal Index';

  const prompt = `You are a data intelligence analyst for Noor AL Reef General Trading LLC, a Dubai-based ${commodity} importer.

Current ${benchmark}: ${currentMarketPrice}

Compacted dataset (top importers by volume):
${JSON.stringify(compactedSignal.topImporters?.slice(0, 30))}

Churn candidates (inactive importers):
${JSON.stringify(compactedSignal.churnRegistry?.slice(0, 10))}

Provide analysis in this EXACT JSON format. No EM dashes. Be specific and actionable:
{
  "priceAudit": {
    "overMarketCount": <number>,
    "underMarketCount": <number>,
    "insight": "<one sentence>"
  },
  "churnStatus": {
    "inactive30_90Days": <number>,
    "commentary": "<one sentence>"
  },
  "monetizationDirective": "<one actionable sentence for the sales team>"
}`;

  try {
    const raw = await groqRequest(keyEnv, [{ role: 'user', content: prompt }]);
    return parseJSON(raw);
  } catch (err) {
    console.error('Data analysis failed:', err);
    const overMarket = topImporters.filter(imp => {
      const p = parseFloat(String(imp.avgPrice).replace(/[^0-9.]/g, '')) || 0;
      return p * 83 > marketPrice;
    }).length;
    return {
      priceAudit: {
        overMarketCount: overMarket,
        underMarketCount: topImporters.length - overMarket,
        insight: `${overMarket} importers are transacting above the current market index.`
      },
      churnStatus: {
        inactive30_90Days: compactedSignal.churnRegistry?.length || 0,
        commentary: 'Review inactive partners for re-engagement.'
      },
      monetizationDirective: `Prioritize outreach to the ${overMarket} over-market importers with index-matched pricing.`
    };
  }
};
