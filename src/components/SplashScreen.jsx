//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React from 'react'
import logo from '../assets/logo.png'

const SplashScreen = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
      flexDirection: 'column',
      animation: 'fadeIn 1s ease-in'
    }}>
      <div style={{
        textAlign: 'center',
        paddingBottom: '2rem'
      }}>
        <img 
          src={logo} 
          alt="Noor Al Reef Logo" 
          style={{ width: '250px', marginBottom: '1.5rem', transform: 'scale(1)', animation: 'zoomIn 1.5s' }} 
        />
        <h2 style={{
          color: 'var(--nar-teal)',
          letterSpacing: '0.1rem',
          fontSize: '1.2rem'
        }}>
          EXECUTIVE INTELLIGENCE
        </h2>
      </div>
    </div>
  )
}

export default SplashScreen
