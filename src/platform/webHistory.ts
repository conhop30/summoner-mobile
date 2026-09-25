// In the installed web app the Back gesture is browser history. To make it close a sheet or menu
// before it leaves the screen, each open sheet gets a history entry of its own:
//
//   open a sheet  → push an entry tagged `__sheet`
//   Back          → that entry is popped; the sheet on top closes
//   dismiss (✕)   → the entry is popped for the user, unless the app has moved on since
//
// If the app navigated while a sheet was open (a sheet that creates a champion and opens it), the
// tagged entry is left behind under the new screen; Back skips over it.

import { backDepth, handleBack, setStackHooks } from './backStack'

interface Tagged { __sheet?: boolean }
const isSheetEntry = (): boolean => (history.state as Tagged | null)?.__sheet === true

export function installWebHistory(): () => void {
  let entries = 0        // history entries this module pushed and that are still in the stack
  let expected = 0       // pops we caused ourselves and must not treat as the user pressing Back
  let closedByBack = 0   // sheets closing because Back already popped their entry

  function onPop() {
    if (expected > 0) { expected--; return }
    if (backDepth() > 0) {
      entries = Math.max(0, entries - 1)
      closedByBack++
      handleBack()
    } else if (isSheetEntry()) {
      // An entry left behind by a sheet that closed after the app had navigated on.
      entries = Math.max(0, entries - 1)
      expected++
      history.back()
    }
  }
  window.addEventListener('popstate', onPop)

  // Popping is deferred by a tick. A menu that closes as the sheet it opened appears (More → About) would
  // otherwise queue a pop and then push, and the browser resolves the pop against the wrong entry.
  // Instead the incoming sheet takes over the entry the outgoing one is leaving.
  let pendingPop: ReturnType<typeof setTimeout> | null = null

  setStackHooks({
    pushed() {
      if (pendingPop !== null) {
        clearTimeout(pendingPop)
        pendingPop = null
        return
      }
      history.pushState({ ...(history.state as object | null), __sheet: true }, '')
      entries++
    },
    released() {
      if (closedByBack > 0) { closedByBack--; return }
      if (entries === 0 || !isSheetEntry()) return // buried under a newer screen; onPop skips it later
      pendingPop = setTimeout(() => {
        pendingPop = null
        if (entries > 0 && isSheetEntry()) {
          entries--
          expected++
          history.back()
        }
      }, 0)
    },
  })

  return () => {
    if (pendingPop !== null) clearTimeout(pendingPop)
    window.removeEventListener('popstate', onPop)
    setStackHooks(null)
  }
}
