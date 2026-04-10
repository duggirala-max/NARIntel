//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//

// Uses allorigins.win as a CORS proxy for browser-based scraping.
// For production (Netlify), replace with server-side GitHub Actions workflow fetch.

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

const fetchViaProxy = async (url) => {
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Proxy fetch failed for ${url}`);
  const data = await res.json();
  return data.contents;
};

// --- Currency Rates ---
const fetchCurrencyRates = async () => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error('Currency API failed');
    const data = await res.json();
    const usd_inr = data.rates?.INR?.toFixed(2) || '83.92';
    const usd_aed = data.rates?.AED || 3.6725;
    const usd_eur = data.rates?.EUR || 0.92;
    const aed_inr = (data.rates?.INR / usd_aed).toFixed(2) || '22.84';
    const eur_inr = (data.rates?.INR / usd_eur).toFixed(2) || '91.45';
    return { aed_inr, usd_inr, eur_inr };
  } catch {
    return { aed_inr: '22.84', usd_inr: '83.92', eur_inr: '91.45' };
  }
};

// --- NECC Namakkal Egg Price ---
const fetchNamakkalRate = async () => {
  try {
    const html = await fetchViaProxy('https://e-necc.com/apps/home/neccrate');
    const match = html.match(/Namakkal[\s\S]*?(\d+\.\d+)/i)
      || html.match(/(\d+\.\d+)/);
    if (match) return `${parseFloat(match[1]).toFixed(2)}`;
    return null;
  } catch {
    return null;
  }
};

// --- Rice Benchmark (IndiaMART) ---
const fetchRiceBenchmark = async () => {
  try {
    const html = await fetchViaProxy('https://www.indiamart.com/proddetail/basmati-rice.html');
    const match = html.match(/Rs\.?\s*(\d+[\d,]*)/i)
      || html.match(/INR\s*(\d+[\d,]*)/i)
      || html.match(/(\d{2,4})\s*\/\s*kg/i);
    if (match) {
      const price = match[1].replace(/,/g, '');
      return parseFloat(price).toFixed(2);
    }
    return null;
  } catch {
    return null;
  }
};

// --- News Scraper ---
const EGG_KEYWORDS = [
  'poultry ban', 'bird flu', 'avian influenza', 'egg import ban', 'egg export',
  'poultry import', 'egg price', 'necc rate', 'poultry trade', 'gcc poultry',
  'hs 0407', 'egg trade'
];

const RICE_KEYWORDS = [
  'rice export ban', 'basmati price', 'non-basmati', 'rice import policy',
  'hs 1006', 'india rice export', 'rice floor price', 'apeda rice',
  'rice trade', 'broken rice', 'rice shortage', 'rice tariff'
];

const NEWS_SOURCES = [
  { name: 'Financial Express', url: 'https://www.financialexpress.com/market/commodities/', region: 'India' },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/news/economy/agriculture', region: 'India' },
  { name: 'Arab News', url: 'https://www.arabnews.com/economy', region: 'Gulf' },
  { name: 'Gulf News', url: 'https://gulfnews.com/business/commodities', region: 'Gulf' },
  { name: 'Khaleej Times', url: 'https://www.khaleejtimes.com/business', region: 'Gulf' }
];

let _newsIdCounter = 1;

const extractArticles = (html, sourceName, region, keywords) => {
  const articles = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const candidates = [
    ...doc.querySelectorAll('h2 a, h3 a, article h2, article h3, .headline a, .title a')
  ];

  for (const el of candidates) {
    const title = el.textContent?.trim();
    if (!title || title.length < 20) continue;
    const lower = title.toLowerCase();
    const matched = keywords.find(kw => lower.includes(kw.toLowerCase()));
    if (!matched) continue;

    const id = `${sourceName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${_newsIdCounter++}`;
    articles.push({
      id,
      title,
      source: sourceName,
      region,
      date: new Date().toISOString().split('T')[0],
      keywords_matched: [matched]
    });
    if (articles.length >= 3) break;
  }
  return articles;
};

const fetchNewsFromSources = async (keywords) => {
  const allArticles = [];
  const seenTitles = new Set();

  for (const src of NEWS_SOURCES) {
    try {
      const html = await fetchViaProxy(src.url);
      const articles = extractArticles(html, src.name, src.region, keywords);
      for (const a of articles) {
        const norm = a.title.toLowerCase().slice(0, 60);
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm);
          allArticles.push(a);
        }
      }
    } catch {
      // continue to next source
    }
  }
  return allArticles;
};

// --- Fallback data ---
const EGG_FALLBACK = {
  namakkal: '5.42',
  trend: 'UP',
  rates: { aed_inr: '22.84', usd_inr: '83.92', eur_inr: '91.45' },
  news: [
    {
      id: 'egg_fallback_001',
      title: 'GCC Poultry Import Regulations Updated for Q2 2026',
      source: 'Arab News',
      region: 'Gulf',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['poultry import'],
      aiImpact: 'MODERATE',
      aiAction: 'Review updated GCC certification requirements before shipping next batch.'
    },
    {
      id: 'egg_fallback_002',
      title: 'NECC Namakkal Rate Climbs on Seasonal Demand',
      source: 'Financial Express',
      region: 'India',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['egg price'],
      aiImpact: 'HIGH RISK',
      aiAction: 'Lock in procurement contracts now before further rate increases impact margins.'
    },
    {
      id: 'egg_fallback_003',
      title: 'Bird Flu Advisory Issued for Select Southern Poultry Districts',
      source: 'Economic Times',
      region: 'India',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['bird flu'],
      aiImpact: 'CRITICAL',
      aiAction: 'Suspend orders from affected districts and activate alternative supplier network immediately.'
    }
  ]
};

const RICE_FALLBACK = {
  riceBenchmark: '68.50',
  unit: 'INR/kg',
  trend: 'STABLE',
  rates: { aed_inr: '22.84', usd_inr: '83.92', eur_inr: '91.45' },
  news: [
    {
      id: 'rice_fallback_001',
      title: 'India Revises Basmati Export Minimum Price for Gulf Markets',
      source: 'Economic Times',
      region: 'India',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['basmati price'],
      aiImpact: 'MODERATE',
      aiAction: 'Renegotiate pricing with Indian suppliers to account for revised export floor price.'
    },
    {
      id: 'rice_fallback_002',
      title: 'GCC Rice Import Volume Rises on Reduced Indian Export Restrictions',
      source: 'Gulf News',
      region: 'Gulf',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['rice import policy'],
      aiImpact: 'POSITIVE',
      aiAction: 'Increase order volume to capitalize on favorable import conditions before policy shifts.'
    },
    {
      id: 'rice_fallback_003',
      title: 'Non-Basmati Rice Export Quota Tightened Amid Domestic Supply Concerns',
      source: 'Financial Express',
      region: 'India',
      date: new Date().toISOString().split('T')[0],
      keywords_matched: ['non-basmati'],
      aiImpact: 'HIGH NEGATIVE',
      aiAction: 'Shift procurement mix toward basmati variants and secure alternative supplier contracts.'
    }
  ]
};

// --- Public API ---
export const scrapeMarketData = async (dashboardType = 'egg') => {
  const rates = await fetchCurrencyRates();

  if (dashboardType === 'rice') {
    let riceBenchmark = await fetchRiceBenchmark();
    const news = await fetchNewsFromSources(RICE_KEYWORDS);

    if (!riceBenchmark) riceBenchmark = RICE_FALLBACK.riceBenchmark;
    const finalNews = news.length > 0 ? news : RICE_FALLBACK.news;

    return {
      riceBenchmark,
      unit: 'INR/kg',
      trend: 'STABLE',
      rates,
      news: finalNews
    };
  }

  // Egg
  let namakkal = await fetchNamakkalRate();
  const news = await fetchNewsFromSources(EGG_KEYWORDS);

  if (!namakkal) namakkal = EGG_FALLBACK.namakkal;
  const finalNews = news.length > 0 ? news : EGG_FALLBACK.news;

  return {
    namakkal,
    trend: 'UP',
    rates,
    news: finalNews
  };
};
