import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useSettings } from '../store/settings'
import Menu, { type MenuItem } from './Menu'
import { HexIcon } from './icons'
import './FloatingWidget.css'

const SIZE = 48
const EDGE = 8
const DRAG_THRESHOLD_PX = 6

interface Props {
  items: MenuItem[]
  // Space to keep clear at the top and bottom of the screen (the header and the navigation bar).
  topInset: number
  bottomInset: number
  hidden?: boolean
}

// A small hex that floats over the screen and opens a menu. It sits on an edge, can be dragged up
// and down (and across, to the other edge), and remembers where it was left. Today its menu holds
// the journal; it is a menu, not a journal button, so more can move in over time.
export default function FloatingWidget({ items, topInset, bottomInset, hidden }: Props) {
  const { widgetY, widgetSide, set } = useSettings()
  const [open, setOpen] = useState(false)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const gesture = useRef<{ startX: number; startY: number; offX: number; offY: number; moved: boolean } | null>(null)

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const minY = topInset + EDGE
  const maxY = Math.max(minY, viewport.h - bottomInset - SIZE - EDGE)
  const restingY = minY + widgetY * (maxY - minY)
  const x = drag ? drag.x : widgetSide === 'right' ? viewport.w - SIZE - EDGE : EDGE
  const y = drag ? drag.y : restingY

  if (hidden) return null

  function down(e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = { startX: e.clientX, startY: e.clientY, offX: e.clientX - x, offY: e.clientY - y, moved: false }
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current
    if (!g) return
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD_PX) return
    g.moved = true
    setDrag({
      x: Math.min(viewport.w - SIZE - EDGE, Math.max(EDGE, e.clientX - g.offX)),
      y: Math.min(maxY, Math.max(minY, e.clientY - g.offY)),
    })
  }

  function up() {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (!g.moved) { setOpen(o => !o); return }
    if (drag) {
      const side = drag.x + SIZE / 2 < viewport.w / 2 ? 'left' : 'right'
      const range = maxY - minY
      set({ widgetSide: side, widgetY: range > 0 ? (drag.y - minY) / range : 0.5 })
    }
    setDrag(null)
  }

  const onLeft = (drag ? drag.x + SIZE / 2 < viewport.w / 2 : widgetSide === 'left')
  const menuStyle = {
    top: Math.min(y, viewport.h - items.length * 52 - bottomInset - 24),
    ...(onLeft ? { left: EDGE + SIZE + 8, right: 'auto' } : { right: EDGE + SIZE + 8, left: 'auto' }),
    transformOrigin: onLeft ? 'top left' : 'top right',
  }

  return (
    <>
      <button
        className={`widget${drag ? ' dragging' : ''}${open ? ' open' : ''}`}
        style={{ left: x, top: y, width: SIZE, height: SIZE }}
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { gesture.current = null; setDrag(null) }}
        onContextMenu={e => e.preventDefault()}
      >
        <HexIcon size={26} />
      </button>
      <Menu open={open} onClose={() => setOpen(false)} items={items} placement="custom" style={menuStyle} />
    </>
  )
}
