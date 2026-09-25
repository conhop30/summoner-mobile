// The in-memory library of champions the screens read from. Edits apply instantly here and are
// written to storage a moment later (or immediately when the app is hidden), so typing never waits
// on the database and closing the app never loses the last keystrokes.

import { create } from 'zustand'
import { applyEdit, createChampion, type Champion } from '../model/champion'
import * as db from './db'

const SAVE_DELAY_MS = 400
// After this many saved edits with no export, the menu shows a quiet reminder.
export const EXPORT_REMINDER_AFTER = 30

interface LibraryState {
  champions: Champion[]
  loaded: boolean
  lastExportedAt: string | null
  editsSinceExport: number

  load: () => Promise<void>
  create: (name: string) => Champion
  edit: (id: string, change: (c: Champion) => Champion) => void
  remove: (id: string) => Promise<void>
  // Writes champions from an import (already merged and stamped by the caller).
  put: (champions: Champion[]) => Promise<void>
  markExported: () => Promise<void>
  flush: () => Promise<void>
}

const dirty = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null

export const useLibrary = create<LibraryState>((set, get) => {
  async function flush() {
    if (timer) { clearTimeout(timer); timer = null }
    if (dirty.size === 0) return
    const ids = [...dirty]
    dirty.clear()
    const byId = new Map(get().champions.map(c => [c.id, c]))
    await db.putChampions(ids.map(id => byId.get(id)).filter((c): c is Champion => !!c))
    const edits = get().editsSinceExport + ids.length
    set({ editsSinceExport: edits })
    await db.setMeta('edits_since_export', edits)
  }

  function saveSoon(id: string) {
    dirty.add(id)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { void flush() }, SAVE_DELAY_MS)
  }

  return {
    champions: [],
    loaded: false,
    lastExportedAt: null,
    editsSinceExport: 0,

    async load() {
      const [champions, lastExportedAt, edits] = await Promise.all([
        db.getAllChampions(),
        db.getMeta<string>('last_exported_at'),
        db.getMeta<number>('edits_since_export'),
      ])
      champions.sort((a, b) => b.concept_updated_at.localeCompare(a.concept_updated_at))
      set({ champions, loaded: true, lastExportedAt: lastExportedAt ?? null, editsSinceExport: edits ?? 0 })
    },

    create(name) {
      const champion = createChampion(name.trim() || 'Untitled champion')
      set(s => ({ champions: [champion, ...s.champions] }))
      saveSoon(champion.id)
      return champion
    },

    edit(id, change) {
      let changed = false
      set(s => ({
        champions: s.champions.map(c => {
          if (c.id !== id) return c
          const next = applyEdit(c, change)
          changed = next !== c
          return next
        }),
      }))
      if (changed) saveSoon(id)
    },

    async remove(id) {
      dirty.delete(id)
      set(s => ({ champions: s.champions.filter(c => c.id !== id) }))
      await db.deleteChampion(id)
    },

    async put(champions) {
      const ids = new Set(champions.map(c => c.id))
      set(s => ({ champions: [...champions, ...s.champions.filter(c => !ids.has(c.id))] }))
      await db.putChampions(champions)
    },

    async markExported() {
      const now = new Date().toISOString()
      set({ lastExportedAt: now, editsSinceExport: 0 })
      await Promise.all([db.setMeta('last_exported_at', now), db.setMeta('edits_since_export', 0)])
    },

    flush,
  }
})

// Never lose the last edits when the app is backgrounded or closed.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void useLibrary.getState().flush() })
  window.addEventListener('pagehide', () => { void useLibrary.getState().flush() })
}
