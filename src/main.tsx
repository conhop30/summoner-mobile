import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isNative } from './platform'
import { initKeyboard } from './platform/keyboard'
import { initPwa } from './platform/pwa'
import { installWebHistory } from './platform/webHistory'
import './styles/tokens.css'
import './styles/base.css'
import './styles/forms.css'
import './styles/screen.css'

initKeyboard()
initPwa()
if (!isNative()) installWebHistory()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
