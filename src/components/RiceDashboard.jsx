//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React, { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.png';
import { scrapeMarketData } from '../services/marketScrapers';
import { analyzeNewsIntelligence, analyzeDataIntelligence } from '../services/groqService';
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
  const [isRunning, setIsRunning] = useState(false);
  const [isDashboardActive, setIsDashboardActive] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dataIntelligence, setDataIntelligence] = useState(null);
  const [extractionResults, setExtractionResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [workerStatus, setWorkerStatus] = useState('');
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/dataWorker.js', import.meta.url), { type: 'module' }
    );
    workerRef.current.onmessage = async (e) => {
      const { status, compactedSignal, message } = e.data;
      if (status === 'SUCCESS') {
        setExtractionResults(compactedSignal);
        setWorkerStatus('Analyzing with AI...');
        const currentPrice = dashboardData?.riceBenchmark || '0';
        const ai = await analyzeDataIntelligence(compactedSignal, currentPrice, 'rice');
        setDataIntelligence(ai);
        setWorkerStatus('');
      } else if (status === 'ERROR') {
        console.error('Worker error:', message);
        setWorkerStatus('Dataset processing failed.');
      }
    };
    return () => workerRef.current.terminate();
  }, [dashboardData?.riceBenchmark]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setWorkerStatus('Processing dataset...');
    workerRef.current.postMessage({ action: 'PROCESS_DATA', file, hsCode: '1006' });
  };

  const handleRunDashboard = async () => {
    setIsRunning(true);
    setIsDashboardActive(true);
    setDashboardData(null);
    setDataIntelligence(null);
    setExtractionResults(null);
    try {
      const rawMarketData = await scrapeMarketData('rice');
      const analyzedNews = await analyzeNewsIntelligence(rawMarketData.news, 'rice');
      setDashboardData({ ...rawMarketData, news: analyzedNews });
    } catch (e) {
      console.error('Dashboard run error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const shareMarketIndex = () => {
    const d = dashboardData;
    whatsappShare(
      `[NOOR AL REEF MARKET UPDATE]\nRice Market Index: INR ${d.riceBenchmark}/kg\nTrend: ${d.trend || 'N/A'}\nAED/INR: ${d.rates?.aed_inr}\nUSD/INR: ${d.rates?.usd_inr}\nEUR/INR: ${d.rates?.eur_inr || 'N/A'}\n-- Noor AL Reef Executive Intelligence`
    );
  };

  const exportModalData = {
    ...dashboardData,
    dataIntelligence: dataIntelligence ? { ...dataIntelligence, extractionResults } : null
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <button onClick={onBack} className="nar-button" style={{ width: '100%', marginBottom: '1rem' }}>
          Back to Hub
        </button>
        {isDashboardActive && !isRunning && (
          <button onClick={() => { setShowExportModal(true); setIsMenuOpen(false); }} className="nar-button" style={{ width: '100%' }}>
            Generate Report
          </button>
        )}
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
            <p style={{ fontSize: '0.6rem', color: 'var(--nar-teal)', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.7rem', backgroundColor: 'var(--nar-teal)' }}>
              BACK TO HUB
            </button>
            {dashboardData?.rates && (
              <div style={{ display: 'flex', gap: '0.8rem', backgroundColor: '#f8f9fa', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.aed_inr}</strong>
                  <span style={{ color: '#888' }}> AED</span>
                </div>
                <div style={{ fontSize: '0.8rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
                  <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.usd_inr}</strong>
                  <span style={{ color: '#888' }}> USD</span>
                </div>
              </div>
            )}
            {!isDashboardActive ? (
              <button onClick={handleRunDashboard} className="nar-button" style={{ fontSize: '0.8rem' }}>
                Start Monitoring
              </button>
            ) : (
              <button onClick={() => setShowExportModal(true)} className="nar-button" style={{ fontSize: '0.8rem' }}>
                Generate Report
              </button>
            )}
          </div>
        )}
      </header>

      {isMobile && dashboardData?.rates && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', backgroundColor: '#f8f9fa', padding: '0.6rem', borderBottom: '1px solid #eee' }}>
           <div style={{ fontSize: '0.75rem' }}>
             <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.aed_inr}</strong>
             <span style={{ color: '#888' }}> AED/INR</span>
           </div>
           <div style={{ fontSize: '0.75rem', borderLeft: '1px solid #ddd', paddingLeft: '1.2rem' }}>
             <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.usd_inr}</strong>
             <span style={{ color: '#888' }}> USD/INR</span>
           </div>
        </div>
      )}

      <main style={{ padding: isMobile ? '1.5rem' : '3rem', flex: 1 }}>
        {!isDashboardActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', textAlign: 'center' }}>
            <div style={{ width: '4px', height: '60px', backgroundColor: 'var(--nar-teal)', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', marginBottom: '1rem', fontWeight: '500' }}>
              Surveillance Ready
            </h2>
            <p style={{ color: '#666', maxWidth: '400px', lineHeight: '1.6', fontSize: '0.85rem' }}>
              Select <strong>"Start Monitoring"</strong> to synchronize with the latest market indicators.
            </p>
            {isMobile && (
              <button onClick={handleRunDashboard} className="nar-button" style={{ marginTop: '2rem', width: '100%', backgroundColor: 'var(--nar-teal)' }}>
                Start Dashboard Monitoring
              </button>
            )}
          </div>
        ) : isRunning ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div className="spinner" />
            <p style={{ marginTop: '1.5rem', color: 'var(--nar-teal)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Compiling Data...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem' }}>
            
            {/* Sidebar (Moved top for mobile) */}
            <div style={{ flex: isMobile ? 'none' : '0 0 320px', display: 'flex', flexDirection: 'column', gap: '1.5rem', order: isMobile ? 1 : 2 }}>
              
              {/* Rice Index */}
              <div style={{ backgroundColor: 'var(--nar-black)', color: 'white', padding: isMobile ? '2rem' : '2.5rem', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Market Index (Rice)
                </div>
                <div style={{ fontSize: isMobile ? '2.2rem' : '2.8rem', fontWeight: 'bold', color: 'var(--nar-emerald)', letterSpacing: '-0.02em' }}>
                  INR {dashboardData?.riceBenchmark || '0.00'}
                </div>
                <button
                  onClick={shareMarketIndex}
                  style={{ marginTop: '1rem', background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  &#128172; Share Index
                </button>
              </div>

              {/* Bulk Analytics */}
              <div style={{ border: '1px solid #eee', padding: isMobile ? '1.8rem' : '2.5rem', borderRadius: '28px', backgroundColor: 'white' }}>
                <h4 style={{ marginBottom: '1.2rem', fontSize: '0.8rem', color: '#111', textTransform: 'uppercase' }}>
                  Bulk Analytics
                </h4>
                {dataIntelligence ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ borderLeft: '3px solid var(--nar-emerald)', paddingLeft: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                        {dataIntelligence.priceAudit?.overMarketCount} Higher Index
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#333' }}>
                      <strong>Proposal:</strong> {dataIntelligence.monetizationDirective}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#fafafa', borderRadius: '14px', color: '#aaa', fontSize: '0.75rem' }}>
                    {workerStatus || 'Awaiting bulk dataset.'}
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--nar-teal)' }}
                  className="nar-button-primary"
                >
                  {uploadedFile ? 'Dataset Sync' : 'Upload Data'}
                </button>
              </div>
            </div>

            {/* News Column */}
            <div style={{ flex: 1, order: isMobile ? 2 : 1 }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888' }}>
                Global Risk Intelligence
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dashboardData?.news?.map((news, i) => (
                  <div key={i} style={{ backgroundColor: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--nar-teal)', fontWeight: 'bold' }}>{news.source}</span>
                      <ImpactBadge impact={news.aiImpact} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: '#111' }}>{news.title}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#666', lineHeight: '1.5', margin: 0 }}>
                      <strong>Action:</strong> {news.aiAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.7rem', borderTop: '1px solid #eee' }}>
        © {new Date().getFullYear()} Noor AL Reef General Trading LLC | Authorized Surveillance Unit
      </footer>

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          dashboardData={exportModalData}
          dataIntelligence={dataIntelligence ? { ...dataIntelligence, extractionResults } : null}
          dashboardType="rice"
        />
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top: 4px solid var(--nar-teal); border-radius: 50%; animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default RiceDashboard;
