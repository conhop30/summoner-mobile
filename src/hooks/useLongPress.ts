import { useRef, type PointerEvent } from 'react'

const HOLD_MS = 480
const MOVE_TOLERANCE_PX = 10

// Tap and press-and-hold on one element. A hold that moves (a scroll) is neither.
export function useLongPress(onTap: () => void, onHold: () => void) {
  const state = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> | null; held: boolean } | null>(null)

  function cancel() {
    if (state.current?.timer) clearTimeout(state.current.timer)
    state.current = null
  }

  return {
    onPointerDown(e: PointerEvent) {
      state.current = { x: e.clientX, y: e.clientY, held: false, timer: null }
      state.current.timer = setTimeout(() => {
        if (!state.current) return
        state.current.held = true
        navigator.vibrate?.(10)
        onHold()
      }, HOLD_MS)
    },
    onPointerMove(e: PointerEvent) {
      const s = state.current
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE_PX) cancel()
    },
    onPointerUp() {
      const s = state.current
      if (!s) return
      const wasHeld = s.held
      cancel()
      if (!wasHeld) onTap()
    },
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu(e: { preventDefault: () => void }) { e.preventDefault() },
  }
}
