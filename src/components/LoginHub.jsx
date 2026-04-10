//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React, { useState } from 'react';
import logo from '../assets/logo.png';

const LoginHub = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin'; 
    const adminPass = import.meta.env.VITE_ADMIN_PASS || 'password_placeholder';

    if (username === adminUser && password === adminPass) {
      onLogin();
    } else {
      setError('Invalid credentials. Access restricted.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#fcfcfc' }}>
      {/* Brand Visual Side */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--nar-black)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logo} alt="Noor AL Reef" style={{ height: '150px', marginBottom: '2rem' }} />
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', letterSpacing: '0.02em', marginBottom: '1rem' }}>Noor AL Reef</h1>
          <h2 style={{ color: 'var(--nar-orange)', fontSize: '1.2rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.2rem' }}>General Trading LLC</h2>
        </div>
        <div style={{ position: 'absolute', bottom: '2rem', color: '#444', fontSize: '0.7rem' }}>
          EXECUTIVE BUSINESS INTELLIGENCE
        </div>
      </div>

      {/* Login Side */}
      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '450px', width: '100%', padding: '3.5rem', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ color: 'var(--nar-black)', fontSize: '1.6rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>Login Hub</h1>
            <p style={{ color: 'var(--nar-orange)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Executive Access ONLY</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#444' }}>Professional Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter authorized email"
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#444' }}>Secure Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '1rem' }}
              />
            </div>

            {error && <p style={{ color: '#d32f2f', fontSize: '0.85rem', textAlign: 'center', fontWeight: '500' }}>{error}</p>}

            <button type="submit" className="nar-button" style={{ marginTop: '1.5rem', padding: '1.2rem', fontSize: '1.1rem' }}>Authorize Entry</button>
          </form>

          <p style={{ fontSize: '0.7rem', color: '#ccc', textAlign: 'center', marginTop: '4rem' }}>
            © {new Date().getFullYear()} Noor AL Reef General Trading LLC | Powered by Raaya Global UG
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHub;
