import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initKeyboard } from './platform/keyboard'
import './styles/tokens.css'
import './styles/base.css'
import './styles/forms.css'
import './styles/screen.css'

initKeyboard()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
