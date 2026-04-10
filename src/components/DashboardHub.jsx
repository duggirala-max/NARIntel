//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React from 'react';
import logo from '../assets/logo.png';

const DashboardHub = ({ onSelectDashboard, onLogout }) => {
  const dashboards = [
    {
      id: 'egg',
      title: 'Egg Executive Intelligence',
      description: 'HS 0407 Trade Analysis and Gulf Market Signals',
      active: true,
      color: 'var(--nar-orange)'
    },
    {
      id: 'rice',
      title: 'Rice Intelligence',
      description: 'HS 1006 Export Trends and Logistics Tracking',
      active: true,
      color: 'var(--nar-teal)'
    },
    {
      id: 'fmcg',
      title: 'FMCG Intelligence',
      description: 'Fast Moving Consumer Goods Performance Analytics',
      active: false,
      color: '#ccc'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', padding: '2rem' }}>
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '6rem', padding: '1.2rem 3rem',
        backgroundColor: 'white', borderRadius: '24px',
        boxShadow: '0 4px 30px rgba(0,0,0,0.02)', border: '1px solid #eee'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Noor AL Reef" style={{ height: '40px' }} />
          <div>
            <h2 style={{ fontSize: '1rem', color: 'var(--nar-black)', margin: 0 }}>Noor AL Reef</h2>
            <p style={{ fontSize: '0.6rem', color: 'var(--nar-orange)', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              General Trading LLC
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="nar-button"
          style={{ padding: '0.6rem 1.5rem', fontSize: '0.75rem' }}
        >
          Logout
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '5rem', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--nar-black)', fontSize: '2.2rem', marginBottom: '0.8rem', letterSpacing: '0.01em' }}>
            Executive Intelligence Portal
          </h1>
          <p style={{ color: '#888', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: '600' }}>
            Select specialized surveillance module
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {dashboards.map((dash) => (
            <div
              key={dash.id}
              onClick={() => dash.active && onSelectDashboard(dash.id)}
              style={{
                backgroundColor: 'white', borderRadius: '32px', padding: '3rem',
                boxShadow: dash.active ? `0 15px 40px rgba(0,0,0,0.06)` : 'none',
                border: dash.active ? `1px solid ${dash.color}` : '1px solid #eee',
                cursor: dash.active ? 'pointer' : 'not-allowed',
                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                position: 'relative',
                opacity: dash.active ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (dash.active) {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 25px 60px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (dash.active) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.06)';
                }
              }}
            >
              {!dash.active && (
                <div style={{
                  position: 'absolute', top: '1.5rem', right: '1.5rem',
                  backgroundColor: '#f5f5f5', padding: '0.4rem 0.8rem',
                  borderRadius: '12px', fontSize: '0.6rem', fontWeight: '700',
                  color: '#aaa', letterSpacing: '0.05em'
                }}>
                  COMING SOON
                </div>
              )}

              <div style={{
                width: '12px', height: '12px', borderRadius: '4px',
                backgroundColor: dash.color, marginBottom: '2rem'
              }} />

              <h3 style={{ marginBottom: '1.2rem', color: dash.active ? '#000' : '#888', fontSize: '1.4rem' }}>
                {dash.title}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '2.5rem' }}>
                {dash.description}
              </p>

              {dash.active && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  color: dash.color, fontWeight: '700',
                  fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Access Module
                  <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <footer style={{ marginTop: '8rem', paddingBottom: '3rem', textAlign: 'center', color: '#ccc', fontSize: '0.7rem' }}>
        © {new Date().getFullYear()} Noor AL Reef General Trading LLC | High-Surveillance Internal Portal
      </footer>
    </div>
  );
};

export default DashboardHub;
