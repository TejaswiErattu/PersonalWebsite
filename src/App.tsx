import { Suspense, lazy, useEffect, useRef, useState } from 'react'

import ClassicMode from './components/ClassicMode'
import CreditsPage, { CreditsOverlay } from './components/Credits'
import LoadingScreen from './components/LoadingScreen'
import NotFound from './components/NotFound'
import ProjectPage from './components/ProjectPage'
import SectionPage from './components/SectionPage'
import TopBar from './components/TopBar'
import { Link, navigate, useRoute } from './router'
import { useDocumentHead } from './seo/useDocumentHead'
import './App.css'

/**
 * The game is the only thing that pulls in Kaplay, and Kaplay is by far the
 * largest dependency in the project. Loading it lazily means a visitor who
 * lands on — or navigates to — any readable route never downloads the engine
 * at all; the chunk is fetched the moment the `/play` route mounts.
 *
 * Nothing else is lazy. The classic routes are plain markup, they are the
 * accessible fallback, and splitting them would add a network round-trip to
 * the path that exists precisely for people on poor connections.
 */
const GameCanvas = lazy(() => import('./components/GameCanvas'))

function GameView() {
  return (
    <main className="game-view">
      {/* The village is a canvas, so it contributes no text to the document.
          This heading is the view's h1 and is visually hidden rather than
          omitted — a page with no h1 is a page a screen-reader user cannot
          orient themselves on. */}
      <h1 className="sr-only">Explore the village</h1>
      <Suspense fallback={<LoadingScreen progress={null} label="Downloading the game" />}>
        <GameCanvas />
      </Suspense>
      <p className="sr-only">
        Prefer to read? <Link to="/">View the portfolio as a page.</Link>
      </p>
    </main>
  )
}

export default function App() {
  const route = useRoute()
  const [creditsOpen, setCreditsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useDocumentHead(route)

  /**
   * Client-side navigation does not move focus or scroll position the way a
   * real page load does, so both are done by hand. Without this, a keyboard
   * user activates a nav link and their focus stays on the link they just
   * left, in a document that has silently swapped underneath them.
   *
   * Skipped on first render so arriving at a deep link does not steal focus
   * from the document before the visitor has done anything.
   */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    contentRef.current?.focus()
  }, [route])

  const isGame = route.id === 'play'

  let view
  if (route.id === 'home') {
    view = <ClassicMode />
  } else if (isGame) {
    view = <GameView />
  } else if (route.id === 'credits') {
    view = <CreditsPage />
  } else if (route.section) {
    view = <SectionPage route={route} />
  } else if (route.project) {
    view = <ProjectPage route={route} />
  } else {
    view = <NotFound />
  }

  return (
    <div className={`app app-${isGame ? 'game' : 'classic'}`}>
      {/* First tab stop on the page: lets a keyboard user jump the whole nav
          strip instead of tabbing through nine links to reach the content. */}
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <TopBar
        mode={isGame ? 'game' : 'classic'}
        onToggleMode={() => navigate(isGame ? '/' : '/play')}
        onOpenCredits={() => setCreditsOpen(true)}
      />
      <div
        id="main-content"
        className="app-content"
        ref={contentRef}
        tabIndex={-1}
      >
        {view}
      </div>
      {creditsOpen && <CreditsOverlay onClose={() => setCreditsOpen(false)} />}
    </div>
  )
}
