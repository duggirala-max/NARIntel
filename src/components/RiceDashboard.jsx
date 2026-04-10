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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: 'white', padding: '1.2rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} className="nar-button"
            style={{ marginRight: '2rem', padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
            BACK TO HUB
          </button>
          <img src={logo} alt="Noor AL Reef" style={{ height: '45px', marginRight: '1rem' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', color: 'var(--nar-black)', margin: 0 }}>
              Noor AL Reef General Trading LLC
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--nar-teal)', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rice Intelligence (HS 1006)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {dashboardData?.rates && (
            <div style={{ display: 'flex', gap: '0.8rem', backgroundColor: '#f8f9fa', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #eee' }}>
              <div style={{ fontSize: '0.8rem' }}>
                <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.aed_inr}</strong>
                <span style={{ color: '#888' }}> AED/INR</span>
              </div>
              <div style={{ fontSize: '0.8rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
                <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.usd_inr}</strong>
                <span style={{ color: '#888' }}> USD/INR</span>
              </div>
              <div style={{ fontSize: '0.8rem', borderLeft: '1px solid #ddd', paddingLeft: '0.8rem' }}>
                <strong style={{ color: 'var(--nar-teal)' }}>{dashboardData.rates.eur_inr || 'N/A'}</strong>
                <span style={{ color: '#888' }}> EUR/INR</span>
              </div>
            </div>
          )}
          {!isDashboardActive ? (
            <button onClick={handleRunDashboard} className="nar-button">
              Start Dashboard Monitoring
            </button>
          ) : (
            <button onClick={() => setShowExportModal(true)} className="nar-button">
              Generate Report
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: '3rem', flex: 1 }}>
        {!isDashboardActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', textAlign: 'center' }}>
            <div style={{ width: '4px', height: '100px', backgroundColor: 'var(--nar-teal)', marginBottom: '2rem' }} />
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: '500' }}>
              Rice Surveillance Ready
            </h2>
            <p style={{ color: '#666', maxWidth: '500px', lineHeight: '1.8', fontSize: '0.95rem' }}>
              Select <strong>"Start Dashboard Monitoring"</strong> to synchronize with the latest rice market indicators and risk alerts.
            </p>
          </div>
        ) : isRunning ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div className="spinner" />
            <p style={{ marginTop: '1.5rem', color: 'var(--nar-teal)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              Compiling Rice Market Field Reports...
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>

            {/* News Column */}
            <div style={{ gridColumn: 'span 8' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', color: '#888', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--nar-teal)', marginRight: '8px' }}>◆</span>
                Global Risk Intelligence (HS 1006)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {dashboardData?.news?.length > 0 ? dashboardData.news.map((news, i) => (
                  <div key={i} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--nar-teal)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {news.source}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <ImpactBadge impact={news.aiImpact} />
                        <button
                          title="Share via WhatsApp"
                          onClick={() => whatsappShare(`[NOOR AL REEF ALERT]\n${news.title}\nSource: ${news.source}\nImpact: ${news.aiImpact}\nDirective: ${news.aiAction}\n-- Noor AL Reef Executive Intelligence`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '2px' }}
                        >
                          &#128172;
                        </button>
                      </div>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#111' }}>{news.title}</h4>
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', padding: '1rem', borderRadius: '14px' }}>
                      <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: '1.6', margin: 0 }}>
                        <strong>Operational Directive:</strong> {news.aiAction}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '3rem', backgroundColor: '#f9f9f9', borderRadius: '24px', color: '#aaa', textAlign: 'center', border: '1px dashed #ddd' }}>
                    No actionable intelligence anomalies detected in this session.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Rice Index */}
              <div style={{ backgroundColor: 'var(--nar-black)', color: 'white', padding: '2.5rem', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Live Market Index (Rice)
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 'bold', color: 'var(--nar-emerald)', letterSpacing: '-0.02em' }}>
                  INR {dashboardData?.riceBenchmark || '0.00'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.4rem' }}>per kg</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.8rem', lineHeight: '1.5' }}>
                  Synchronized with IndiaMART commodity benchmarks.
                </div>
                <button
                  onClick={shareMarketIndex}
                  style={{ marginTop: '1.2rem', background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  &#128172; Share Index
                </button>
              </div>

              {/* Bulk Analytics */}
              <div style={{ border: '1px solid #eee', padding: '2.5rem', borderRadius: '28px', backgroundColor: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bulk Analytics Deep-Dive
                </h4>
                {dataIntelligence ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
                    <div style={{ borderLeft: '4px solid var(--nar-emerald)', paddingLeft: '1.2rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '600' }}>Price Benchmarking</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.3rem' }}>
                        {dataIntelligence.priceAudit?.overMarketCount} Higher than Live Index
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.2rem' }}>
                        {dataIntelligence.priceAudit?.insight}
                      </div>
                    </div>
                    <div style={{ borderLeft: '4px solid var(--nar-teal)', paddingLeft: '1.2rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: '600' }}>Partner Engagement (90D)</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.3rem' }}>
                        {dataIntelligence.churnStatus?.inactive30_90Days} Non-Performing Contracts
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '1.3rem', borderRadius: '14px', fontSize: '0.85rem', color: '#333', border: '1px solid #eee', lineHeight: '1.6' }}>
                      <strong>Executive Proposal:</strong> {dataIntelligence.monetizationDirective}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fafafa', borderRadius: '18px', color: '#aaa', fontStyle: 'italic', fontSize: '0.82rem', border: '1px dashed #eee' }}>
                    {workerStatus || (uploadedFile ? 'Synthesizing Dataset Results...' : 'Awaiting bulk dataset for analysis.')}
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{ width: '100%', marginTop: '2rem' }}
                  className="nar-button"
                >
                  {uploadedFile ? 'Dataset Synchronized' : 'Upload Bulk Trade Data'}
                </button>
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
