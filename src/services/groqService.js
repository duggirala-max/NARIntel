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
  const cacheKey = `news_v2_${dashboardType}_${newsItems.length}_${newsItems[0]?.id || ''}`;
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
      aiImpact: item.aiImpact || 'MODERATE',
      aiActionDubai: 'Monitor volume limits and prepare contingency logistics buffers.',
      aiActionIndia: 'Optimize supply parameters and negotiate fixed rates early.'
    }));
  }

  const hsCode = dashboardType === 'rice' ? '1006' : '0407';
  const simplifiedNews = newsItems.map(n => ({ 
    id: n.id, 
    title: n.title.slice(0, 80), 
    source: n.source 
  }));

  const prompt = `You are a trade analyst for Noor AL Reef (HS ${hsCode}).
Analyze these articles. Return ONLY a valid JSON array using this exact schema:
[{ "id": "...", "aiImpact": "CRITICAL/HIGH RISK/MODERATE/POSITIVE", "aiActionDubai": "one direct tactical sentence for a Dubai importer", "aiActionIndia": "one direct tactical sentence for an Indian exporter" }]
Strictly avoid any conversational text or trailing commentary.
Articles: ${JSON.stringify(simplifiedNews)}`;

  try {
    const raw = await groqRequest(keyEnv, [{ role: 'user', content: prompt }]);
    const analyzed = parseJSON(raw);
    const result = newsItems.map(item => {
      const match = analyzed.find(a => a.id === item.id);
      return match ? { 
        ...item, 
        aiImpact: match.aiImpact, 
        aiActionDubai: match.aiActionDubai, 
        aiActionIndia: match.aiActionIndia 
      } : {
        ...item,
        aiImpact: 'MODERATE',
        aiActionDubai: 'Verify capacity constraints.',
        aiActionIndia: 'Review export cost thresholds.'
      };
    });
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn('News analysis failed, returning baseline perspectives:', err.message);
    return newsItems.map(item => ({
      ...item,
      aiImpact: item.aiImpact || 'MODERATE',
      aiActionDubai: 'Maintain general cargo reserves.',
      aiActionIndia: 'Secure shipping windows.'
    }));
  }
};

export const analyzeDataIntelligence = async () => {
  // Disabled: Bulk Analytics capability removed per mandate
  return null;
};

