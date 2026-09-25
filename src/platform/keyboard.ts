// The on-screen keyboard. It covers the page rather than resizing it, so the app measures how much
// it covers and lifts its own screens and sheets by that much.

import { create } from 'zustand'

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

  // The keyboard shrinks the visual viewport, not the page, and the browser may also pan the visual
  // viewport down to keep the field in view.
  const vv = window.visualViewport
  if (!vv) return
  const update = () => setHeight(keyboardCover(document.documentElement.clientHeight, vv.offsetTop, vv.height))
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
}

// How much of the bottom of the page the keyboard covers: whatever lies below the visual viewport.
// Small differences are the browser's own toolbar showing or hiding, not a keyboard.
export function keyboardCover(layoutHeight: number, viewportTop: number, viewportHeight: number): number {
  const covered = layoutHeight - (viewportTop + viewportHeight)
  return covered > 120 ? covered : 0
}
