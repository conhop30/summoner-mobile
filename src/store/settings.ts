// The few per-device preferences the app has. Kept in localStorage: cheap, synchronous, and fine to lose.

import { create } from 'zustand'

export type NavStyle = 'bottom' | 'drawer'

const KEY = 'summoner-mobile.settings'

interface Persisted {
  navStyle: NavStyle
  // Where the floating widget sits along the screen edge (0 = top, 1 = bottom of its range) and which edge.
  widgetY: number
  widgetSide: 'left' | 'right'
}

const DEFAULTS: Persisted = { navStyle: 'bottom', widgetY: 0.62, widgetSide: 'right' }

function read(): Persisted {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Persisted>
    return {
      navStyle: raw.navStyle === 'drawer' ? 'drawer' : 'bottom',
      widgetY: typeof raw.widgetY === 'number' ? Math.min(1, Math.max(0, raw.widgetY)) : DEFAULTS.widgetY,
      widgetSide: raw.widgetSide === 'left' ? 'left' : 'right',
    }
  } catch {
    return DEFAULTS
  }
}

function write(value: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(value)) } catch { /* private mode or cleared storage: not critical */ }
}

interface SettingsState extends Persisted {
  set: (patch: Partial<Persisted>) => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...read(),
  set(patch) {
    set(patch)
    const { navStyle, widgetY, widgetSide } = get()
    write({ navStyle, widgetY, widgetSide })
  },
}))
