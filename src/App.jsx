//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
import React, { useState, useEffect } from 'react'
import SplashScreen from './components/SplashScreen'
import LoginHub from './components/LoginHub'
import DashboardHub from './components/DashboardHub'
import EggDashboard from './components/EggDashboard'
import RiceDashboard from './components/RiceDashboard'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentDashboard, setCurrentDashboard] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) return <SplashScreen />
  if (!isLoggedIn) return <LoginHub onLogin={() => setIsLoggedIn(true)} />
  if (currentDashboard === 'egg') return <EggDashboard onBack={() => setCurrentDashboard(null)} />
  if (currentDashboard === 'rice') return <RiceDashboard onBack={() => setCurrentDashboard(null)} />

  return (
    <DashboardHub
      onSelectDashboard={(id) => setCurrentDashboard(id)}
      onLogout={() => { setIsLoggedIn(false); setCurrentDashboard(null); }}
    />
  )
}

export default App
