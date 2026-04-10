import React from 'react';

const InsightsModal = ({ onClose, extractionResults, dataIntelligence }) => {
  const { topImporters = [] } = extractionResults || {};

  const handleWhatsApp = (phone, name, vol) => {
    // A more human-like template, as instructed
    const cleanPhone = phone?.toString().replace(/[^0-9]/g, '') || '';
    if (!cleanPhone) {
      alert(`No contact number recorded for ${name}.`);
      return;
    }
    const message = `Hi ${name}, I hope this message finds you well! I noticed your recent import activity involving ${vol} units. We have some premium stock available right now that could perfectly supplement your upcoming needs. Let me know if you're open to a quick chat about pricing availability. Best regards.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: '1.4rem', color: '#111' }}>Detailed Analytics Matrix</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        
        <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: '#f9f9f9', borderRadius: '12px', borderLeft: '4px solid var(--nar-emerald)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>AI Executive Summary</h4>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: 0, lineHeight: '1.5' }}>
            {dataIntelligence?.monetizationDirective || 'No specific AI directives found for this dataset.'}
          </p>
        </div>

        <h3 style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1rem', textTransform: 'uppercase' }}>Targeted Purchasers</h3>
        
        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={thStyle}>Importer Node</th>
                <th style={thStyle}>Volume Detected</th>
                <th style={thStyle}>Est. Value</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Direct Action</th>
              </tr>
            </thead>
            <tbody>
              {topImporters.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No bulk importer profiles found in this dataset.</td></tr>
              ) : (
                topImporters.map((imp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdStyle}><strong>{imp.name}</strong></td>
                    <td style={tdStyle}>{imp.volume}</td>
                    <td style={{ ...tdStyle, color: '#666' }}>{imp.avgPrice}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button 
                        onClick={() => handleWhatsApp(imp.phone, imp.name, imp.volume)}
                        style={{...waBtnStyle, opacity: imp.phone ? 1 : 0.4}}
                        title={imp.phone ? `Connect with ${imp.name}` : `No phone number on record`}
                      >
                         Launch Comms
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalStyle = {
  backgroundColor: 'white', width: '90%', maxWidth: '900px', maxHeight: '85vh',
  borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
};
const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'
};
const closeBtnStyle = {
  background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888'
};
const tableContainerStyle = {
  flex: 1, overflowY: 'auto'
};
const thStyle = {
  padding: '1rem 0.5rem', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
};
const tdStyle = {
  padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#333'
};
const waBtnStyle = {
  backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '20px',
  padding: '0.5rem 1.2rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold',
  display: 'inline-flex', alignItems: 'center', gap: '5px'
};

export default InsightsModal;
