// The on-screen keyboard. On Android the WebView does not resize when it opens (the app draws
// edge to edge), so the app is told the keyboard's height and lifts its own screens and sheets by it.

import { Keyboard } from '@capacitor/keyboard'
import { create } from 'zustand'
import { isNative } from './index'

export const useKeyboard = create<{ height: number }>(() => ({ height: 0 }))

function setHeight(height: number) {
  const rounded = Math.max(0, Math.round(height))
  if (useKeyboard.getState().height === rounded) return
  useKeyboard.setState({ height: rounded })
  document.documentElement.style.setProperty('--kb', `${rounded}px`)
}

const isField = (t: EventTarget | null): t is HTMLElement =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')

// Once the screen has made room, bring the field being typed in into view.
function revealFocusedField() {
  const el = document.activeElement
  if (isField(el)) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

export function initKeyboard(): void {
  document.addEventListener('focusin', e => { if (isField(e.target)) setTimeout(revealFocusedField, 320) })

  if (isNative()) {
    void Keyboard.addListener('keyboardWillShow', info => setHeight(info.keyboardHeight))
    void Keyboard.addListener('keyboardDidShow', () => revealFocusedField())
    void Keyboard.addListener('keyboardWillHide', () => setHeight(0))
    return
  }

  // A browser (development, tests): the visual viewport shrinks when a keyboard opens.
  const vv = window.visualViewport
  if (!vv) return
  let tallest = vv.height
  vv.addEventListener('resize', () => {
    tallest = Math.max(tallest, vv.height)
    setHeight(tallest - vv.height > 120 ? tallest - vv.height : 0)
  })
}
