//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import { scrapeRicePrices, scrapeMarketNews, fetchCurrencyRates } from '../services/marketScrapers';
import { analyzeNewsIntelligence } from '../services/groqService';
import ExportModal from './PDFExportModal';

const whatsappShare = (text) => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const ImpactBadge = ({ impact }) => {
  const isCritical = impact?.includes('CRITICAL') || impact?.includes('HIGH RISK') || impact?.includes('HIGH NEGATIVE');
  return (
    <span style={{
      fontSize: '0.68rem',
      backgroundColor: isCritical ? '#fff0f0' : (impact?.includes('POSITIVE') ? '#f0fff4' : '#fff8f0'),
      color: isCritical ? '#d32f2f' : (impact?.includes('POSITIVE') ? '#2e7d32' : '#b35a00'),
      padding: '3px 10px', borderRadius: '20px', fontWeight: '700'
    }}>{impact}</span>
  );
};

const RiceDashboard = ({ onBack }) => {
  const [isNewsRunning, setIsNewsRunning] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    benchmarks: { basmati: '114.50', nonBasmati: '38.20', sonaMasuri: '54.80' },
    source: 'https://dir.indiamart.com/impcat/basmati-rice.html',
    rates: { aed_inr: '22.84', usd_inr: '83.92', eur_inr: '91.45' },
    news: []
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    const loadPrices = async () => {
      try {
        const ricePrices = await scrapeRicePrices();
        const currencyRates = await fetchCurrencyRates();
        setDashboardData(prev => ({
          ...prev,
          benchmarks: {
            basmati: ricePrices.basmati,
            nonBasmati: ricePrices.nonBasmati,
            sonaMasuri: ricePrices.sonaMasuri
          },
          source: ricePrices.source,
          rates: currencyRates
        }));
      } catch (err) {
        console.warn('Background price fetch failed.', err);
      }
    };

    loadPrices();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefreshNews = async () => {
    setIsNewsRunning(true);
    try {
      const rawNews = await scrapeMarketNews('rice');
      const analyzedNews = await analyzeNewsIntelligence(rawNews, 'rice');
      setDashboardData(prev => ({
        ...prev,
        news: analyzedNews
      }));
    } catch (e) {
      console.error('News refresh failed:', e);
    } finally {
      setIsNewsRunning(false);
    }
  };

  const shareMarketIndex = () => {
    const d = dashboardData;
    whatsappShare(
      `[NOOR AL REEF MARKET UPDATE]\nBasmati Index: INR ${d.benchmarks?.basmati}\nNon-Basmati: INR ${d.benchmarks?.nonBasmati}\nSona Masuri: INR ${d.benchmarks?.sonaMasuri}\n-- Noor AL Reef Executive Intelligence`
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <button onClick={onBack} className="nar-button" style={{ width: '100%', marginBottom: '1rem' }}>
          Back to Hub
        </button>
        <button onClick={handleRefreshNews} className="nar-button" style={{ width: '100%', marginBottom: '1rem' }}>
          Refresh News & Actions
        </button>
        <button onClick={() => { setShowExportModal(true); setIsMenuOpen(false); }} className="nar-button" style={{ width: '100%' }}>
          Generate Report
        </button>
      </div>

      <header style={{
        backgroundColor: 'white', padding: isMobile ? '1rem 1.5rem' : '1.2rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Noor AL Reef" style={{ height: isMobile ? '35px' : '45px', marginRight: '1rem' }} />
          <div>
            <h1 style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: 'var(--nar-black)', margin: 0 }}>
              Noor AL Reef
            </h1>
            <p style={{ fontSize: '0.6rem', color: 'var(--nar-orange)', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rice Intelligence
            </p>
          </div>
        </div>

        {isMobile ? (
          <button 
            className={`hamburger ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div />
            <div />
            <div />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button onClick={onBack} className="nar-button"
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.7rem' }}>
              BACK TO HUB
            </button>
            {dashboardData?.rates && (
              <div style={{ display: 'flex', gap: '1rem', backgroundColor: '#f8f9fa', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#888' }}>AED/INR </span>
                  <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.aed_inr}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
                  <span style={{ color: '#888' }}>USD/INR </span>
                  <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.usd_inr}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
                  <span style={{ color: '#888' }}>EUR/INR </span>
                  <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.eur_inr}</strong>
                </div>
              </div>
            )}
            <button onClick={() => setShowExportModal(true)} className="nar-button" style={{ fontSize: '0.8rem', backgroundColor: '#333' }}>
              Generate Report
            </button>
            <button onClick={handleRefreshNews} className="nar-button" style={{ fontSize: '0.8rem' }}>
              {isNewsRunning ? 'Analyzing News...' : 'Refresh News & Actions'}
            </button>
          </div>
        )}
      </header>

      {isMobile && dashboardData?.rates && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.8rem', backgroundColor: '#f8f9fa', padding: '0.6rem', borderBottom: '1px solid #eee' }}>
           <div style={{ fontSize: '0.7rem' }}>
             <span style={{ color: '#888' }}>AED/INR: </span>
             <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.aed_inr}</strong>
           </div>
           <div style={{ fontSize: '0.7rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
             <span style={{ color: '#888' }}>USD/INR: </span>
             <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.usd_inr}</strong>
           </div>
           <div style={{ fontSize: '0.7rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
             <span style={{ color: '#888' }}>EUR/INR: </span>
             <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.eur_inr}</strong>
           </div>
        </div>
      )}

      <main style={{ padding: isMobile ? '1.5rem' : '3rem', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem' }}>
          
          {/* Sidebar */}
          <div style={{ flex: isMobile ? 'none' : '0 0 320px', display: 'flex', flexDirection: 'column', gap: '1.5rem', order: isMobile ? 1 : 2 }}>
            
            {/* Rice Benchmarks */}
            <div style={{ backgroundColor: 'var(--nar-black)', color: 'white', padding: isMobile ? '2rem' : '2.5rem', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: '600' }}>
                Wholesale Indices (INR / Kg)
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Basmati Rice</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--nar-emerald)' }}>
                    {dashboardData.benchmarks?.basmati}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #222', paddingTop: '0.8rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Non-Basmati Rice</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--nar-emerald)' }}>
                    {dashboardData.benchmarks?.nonBasmati}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #222', paddingTop: '0.8rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Sona Masuri</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--nar-emerald)' }}>
                    {dashboardData.benchmarks?.sonaMasuri}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', fontSize: '0.65rem' }}>
                <a href={dashboardData.source} target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'underline' }}>
                  Source Link
                </a>
              </div>
              
              <button
                onClick={shareMarketIndex}
                style={{ marginTop: '1rem', background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                &#128172; Share Indices
              </button>
            </div>

          </div>

          {/* News Column */}
          <div style={{ flex: 1, order: isMobile ? 2 : 1 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888' }}>
              Global Rice Risk Intelligence
            </h3>
            
            {isNewsRunning ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
                <div className="spinner" />
                <p style={{ color: '#888', marginTop: '1rem', fontSize: '0.8rem' }}>Scraping news and gathering intelligence...</p>
              </div>
            ) : dashboardData.news.length === 0 ? (
              <div style={{ padding: '2rem', backgroundColor: '#fafafa', border: '1px dashed #ccc', borderRadius: '24px', textAlign: 'center', color: '#aaa' }}>
                No news currently refreshed. Click "Refresh News & Actions" above to update.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dashboardData.news.map((news, i) => (
                  <div key={i} style={{ backgroundColor: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--nar-teal)', fontWeight: 'bold' }}>{news.source}</span>
                      <ImpactBadge impact={news.aiImpact} />
                    </div>
                    <h4 style={{ fontSize: news.url ? '0.9rem' : '0.95rem', marginBottom: '0.8rem', color: '#111' }}>
                      {news.url ? (
                        <a href={news.url} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'underline' }}>
                          {news.title}
                        </a>
                      ) : (
                        news.title
                      )}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#333', lineHeight: '1.5', margin: '0 0 0.5rem 0' }}>
                      <strong>Dubai Importer Action:</strong> {news.aiActionDubai}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#555', lineHeight: '1.5', margin: 0 }}>
                      <strong>Indian Exporter Action:</strong> {news.aiActionIndia}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.7rem', borderTop: '1px solid #eee' }}>
        © {new Date().getFullYear()} Noor AL Reef General Trading LLC | Authorized Surveillance Unit
      </footer>

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          dashboardData={dashboardData}
          dashboardType="rice"
        />
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top: 4px solid var(--nar-orange); border-radius: 50%; animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default RiceDashboard;
