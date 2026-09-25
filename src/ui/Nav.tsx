// The champion screen's navigation. It is one list of destinations with two ways to show it, so
// changing from a bottom bar to a hamburger menu is a setting, not a rewrite.

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PlayIcon } from './icons'
import { useBackClose, usePresence } from './Sheet'
import './Nav.css'

export type TabKey = 'story' | 'identity' | 'abilities'

export const DESTINATIONS: { key: TabKey; label: string }[] = [
  { key: 'story', label: 'Story' },
  { key: 'identity', label: 'Identity' },
  { key: 'abilities', label: 'Abilities' },
]

export function isTabKey(value: string | undefined): value is TabKey {
  return DESTINATIONS.some(d => d.key === value)
}

interface NavProps {
  current: TabKey
  onSelect: (key: TabKey) => void
}

export function TabBar({ current, onSelect }: NavProps) {
  return (
    <nav className="tabbar" aria-label="Champion sections">
      {DESTINATIONS.map(d => (
        <button
          key={d.key}
          className={`tabbar-item${current === d.key ? ' on' : ''}`}
          aria-current={current === d.key ? 'page' : undefined}
          onClick={() => onSelect(d.key)}
        >
          {d.label}
        </button>
      ))}
    </nav>
  )
}

interface DrawerProps extends NavProps {
  open: boolean
  onClose: () => void
  title: string
  onPresent: () => void
  footer?: ReactNode
}

export function Drawer({ open, onClose, current, onSelect, title, onPresent, footer }: DrawerProps) {
  const { mounted, visible } = usePresence(open)
  useBackClose(open, onClose)
  if (!mounted) return null
  return createPortal(
    <div className={`drawer-root${visible ? ' in' : ''}`}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Menu">
        <div className="drawer-title">{title}</div>
        {DESTINATIONS.map(d => (
          <button
            key={d.key}
            className={`drawer-item${current === d.key ? ' on' : ''}`}
            onClick={() => { onClose(); onSelect(d.key) }}
          >
            {d.label}
          </button>
        ))}
        <div className="drawer-sep" />
        <button className="drawer-item" onClick={() => { onClose(); onPresent() }}><PlayIcon size={18} /> Present</button>
        {footer}
      </aside>
    </div>,
    document.body,
  )
}
