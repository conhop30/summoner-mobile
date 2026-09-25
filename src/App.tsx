import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useLibrary } from './store/library'
import Toast from './ui/Toast'
import Gallery from './screens/Gallery'
import ChampionScreen from './screens/Champion'
import Present from './screens/Present'

// Back is browser history: sheets and menus take part in it (platform/webHistory.ts), and the router
// handles going up a screen, so there is nothing to wire here.
export default function App() {
  const load = useLibrary(s => s.load)
  useEffect(() => { void load() }, [load])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/c/:id/:tab?" element={<ChampionScreen />} />
        <Route path="/present/:id" element={<Present />} />
        <Route path="*" element={<Gallery />} />
      </Routes>
      <Toast />
    </HashRouter>
  )
}
