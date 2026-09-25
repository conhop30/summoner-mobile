import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { exitApp, onHardwareBack, setupSystemChrome } from './platform'
import { handleBack } from './platform/backStack'
import { useLibrary } from './store/library'
import Toast from './ui/Toast'
import Gallery from './screens/Gallery'
import ChampionScreen from './screens/Champion'
import Present from './screens/Present'

// Android's Back button: close the top sheet or menu if there is one, else go up a screen, and
// only leave the app from the gallery.
function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => onHardwareBack(() => {
    if (handleBack()) return
    if (location.pathname === '/') exitApp()
    else navigate(-1)
  }), [navigate, location.pathname])
  return null
}

export default function App() {
  const load = useLibrary(s => s.load)
  useEffect(() => {
    void setupSystemChrome()
    void load()
  }, [load])

  return (
    <HashRouter>
      <BackButton />
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
