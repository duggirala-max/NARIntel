//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React, { useState } from 'react';
import { generateProfessionalPDF } from '../services/pdfService';
import { generateExcelReport } from '../services/excelService';

const ExportModal = ({ onClose, dashboardData, dataIntelligence, dashboardType = 'egg' }) => {
  const [selectedMode, setSelectedMode] = useState('FULL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportType, setExportType] = useState('pdf');

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      if (exportType === 'excel') {
        const combined = {
          ...dataIntelligence,
          topImporters: dataIntelligence?.extractionResults?.topImporters || [],
          churnRegistry: dataIntelligence?.extractionResults?.churnRegistry || [],
          overpayers: dataIntelligence?.extractionResults?.overpayers || [],
          aiAnalysis: dataIntelligence
        };
        generateExcelReport(dashboardData, combined, dashboardType);
      } else {
        const pdfData = {
          ...dashboardData,
          dataIntelligence: selectedMode === 'FULL' ? {
            ...dataIntelligence,
            topImporters: dataIntelligence?.extractionResults?.topImporters || [],
            overpayers: dataIntelligence?.extractionResults?.overpayers || []
          } : null
        };
        await generateProfessionalPDF(pdfData, selectedMode, dashboardType);
      }
      onClose();
    } catch (err) {
      console.error('Export failure:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const options = [
    {
      key: 'pdf-news',
      exportType: 'pdf',
      mode: 'NEWS',
      title: 'Standard Insight Digest',
      desc: 'Risk alerts and operational directives. PDF format.',
      icon: '📄'
    },
    {
      key: 'pdf-full',
      exportType: 'pdf',
      mode: 'FULL',
      title: 'Comprehensive Performance Audit',
      desc: 'Market benchmarks, price audit, churn registry, directives. PDF format.',
      icon: '📊'
    },
    {
      key: 'excel',
      exportType: 'excel',
      mode: null,
      title: 'Processed Data Export',
      desc: 'Ranked importers, churn registry, overpayers, AI summary. Excel format.',
      icon: '📋'
    }
  ];

  const isSelected = (opt) => exportType === opt.exportType && (opt.mode === null || selectedMode === opt.mode);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '24px',
        width: 'min(480px, 95%)', padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ color: 'var(--nar-black)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
          Intelligence Report Generation
        </h2>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.82rem', lineHeight: '1.5' }}>
          Select the export format. All outputs are standardized for executive review.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' }}>
          {options.map(opt => (
            <div
              key={opt.key}
              onClick={() => {
                setExportType(opt.exportType);
                if (opt.mode) setSelectedMode(opt.mode);
              }}
              style={{
                padding: '1.2rem 1.5rem',
                borderRadius: '14px',
                border: `2px solid ${isSelected(opt) ? 'var(--nar-orange)' : '#f0f0f0'}`,
                backgroundColor: isSelected(opt) ? 'rgba(225,119,38,0.04)' : 'white',
                cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                transition: 'all 0.25s ease'
              }}
            >
              <span style={{ fontSize: '1.4rem', marginTop: '1px' }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{opt.title}</div>
                <div style={{ fontSize: '0.73rem', color: '#888' }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.9rem',
              backgroundColor: 'white', border: '1px solid #ddd',
              color: '#666', fontWeight: '600', borderRadius: '12px', fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating}
            className="nar-button"
            style={{ flex: 1, padding: '0.9rem', fontSize: '0.85rem' }}
          >
            {isGenerating ? 'Generating...' : 'Finalize Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
