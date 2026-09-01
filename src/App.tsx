import { useState } from 'react'

import ClassicMode from './components/ClassicMode'
import GameCanvas from './components/GameCanvas'
import LandingScreen from './components/LandingScreen'
import TopBar, { type ViewMode } from './components/TopBar'
import './App.css'

type Screen = 'landing' | ViewMode

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')

  if (screen === 'landing') {
    return <LandingScreen onStart={() => setScreen('game')} onSkip={() => setScreen('classic')} />
  }

  return (
    <div className={`app app-${screen}`}>
      <TopBar
        mode={screen}
        onToggleMode={() => setScreen(screen === 'game' ? 'classic' : 'game')}
        onGoHome={() => setScreen('landing')}
      />
      {screen === 'game' ? <GameCanvas /> : <ClassicMode />}
    </div>
  )
}
