import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { pushBackHandler } from '../platform/backStack'
import { CloseIcon } from './icons'
import './Sheet.css'

const EXIT_MS = 200

// Keeps something mounted just long enough to play its exit transition.
export function usePresence(open: boolean, exitMs = EXIT_MS): { mounted: boolean; visible: boolean } {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timer = setTimeout(() => setMounted(false), exitMs)
    return () => clearTimeout(timer)
  }, [open, exitMs])
  return { mounted, visible }
}

// Android Back closes the top-most thing first: register while open.
// Registered once per opening; a parent re-render that hands over a new onClose must not re-register
// (that would move this sheet to the top of the stack and, on the web, churn the history entries).
export function useBackClose(open: boolean, onClose: () => void): void {
  const latest = useRef(onClose)
  latest.current = onClose
  useEffect(() => (open ? pushBackHandler(() => latest.current()) : undefined), [open])
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  // 'bottom' rises from the bottom edge and is as tall as its content; 'full' fills the screen.
  variant?: 'bottom' | 'full'
  headerExtra?: ReactNode
  children: ReactNode
}

export default function Sheet({ open, onClose, title, variant = 'bottom', headerExtra, children }: SheetProps) {
  const { mounted, visible } = usePresence(open)
  useBackClose(open, onClose)
  if (!mounted) return null

  return createPortal(
    <div className={`sheet-root${visible ? ' in' : ''}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className={`sheet sheet-${variant}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          {headerExtra}
          <button className="icon-btn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
