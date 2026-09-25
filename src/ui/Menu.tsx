import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBackClose, usePresence } from './Sheet'
import './Menu.css'

export interface MenuItem {
  key: string
  label: string
  hint?: string
  icon?: ReactNode
  danger?: boolean
  onSelect: () => void
}

interface MenuProps {
  open: boolean
  onClose: () => void
  items: MenuItem[]
  // Where the menu pops out. `style` is for the floating widget, which positions it by hand.
  placement?: 'top-right' | 'custom'
  style?: React.CSSProperties
}

// A small popover for a handful of actions. Tapping outside, or Back, closes it.
export default function Menu({ open, onClose, items, placement = 'top-right', style }: MenuProps) {
  const { mounted, visible } = usePresence(open, 140)
  useBackClose(open, onClose)
  if (!mounted) return null

  return createPortal(
    <div className={`menu-root${visible ? ' in' : ''}`}>
      <div className="menu-backdrop" onClick={onClose} />
      <div className={`menu menu-${placement}`} style={style} role="menu">
        {items.map(item => (
          <button
            key={item.key}
            role="menuitem"
            className={`menu-item${item.danger ? ' danger' : ''}`}
            onClick={() => { onClose(); item.onSelect() }}
          >
            {item.icon}
            <span className="menu-item-text">
              {item.label}
              {item.hint && <span className="menu-item-hint">{item.hint}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
