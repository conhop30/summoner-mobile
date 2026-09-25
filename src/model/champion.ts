// A champion as this app holds it: exactly the interchange record's concept side (see
// contract/SPEC.md), with no desktop-only section. Everything here is pure and immutable.

import type {
  AbilitySlot, AbilityText, BlockKind, BlockText, ChampionRecord, IdentityRecord, JournalTab,
} from '../interchange/types'
import { SLOTS } from '../interchange/types'

export type Champion = Omit<ChampionRecord, 'desktop'>

export const SLOT_LABEL: Record<AbilitySlot, string> = { passive: 'P', q: 'Q', w: 'W', e: 'E', r: 'R' }
export const SLOT_TYPE: Record<AbilitySlot, string> = { passive: 'Passive', q: 'Q', w: 'W', e: 'E', r: 'Ultimate' }
export const KIND_LABEL: Record<BlockKind, string> = { passive: 'Passive', alternate_form: 'Alternate form', recast: 'Recast' }

export const newId = (): string => crypto.randomUUID()

export function emptyAbilities(): Champion['abilities'] {
  return { passive: {}, q: {}, w: {}, e: {}, r: {} }
}

export function createChampion(name: string, now: string = new Date().toISOString()): Champion {
  return {
    id: newId(),
    created_at: now,
    concept_updated_at: now,
    tags: [],
    identity: { name },
    abilities: emptyAbilities(),
  }
}

// ─── Change detection ────────────────────────────────────────────────────────

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort()
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

// What counts as an edit: everything a champion holds. Used so that opening a champion and changing
// nothing does not make it look newer than the desktop's copy.
export function contentKey(c: Champion): string {
  return stableStringify({ identity: c.identity, abilities: c.abilities, tags: c.tags })
}

// Runs an edit and, only if it changed something, moves the concept stamp.
export function applyEdit(c: Champion, edit: (c: Champion) => Champion, now: string = new Date().toISOString()): Champion {
  const next = edit(c)
  return contentKey(next) === contentKey(c) ? c : { ...next, concept_updated_at: now }
}

// ─── Identity ────────────────────────────────────────────────────────────────

// Empty fields are stored as absent (the name is the one field that always exists).
export function setIdentity(c: Champion, patch: Partial<IdentityRecord>): Champion {
  const merged: Record<string, unknown> = { ...c.identity, ...patch }
  for (const key of Object.keys(merged)) {
    if (key !== 'name' && (merged[key] === undefined || merged[key] === '')) delete merged[key]
  }
  return { ...c, identity: merged as unknown as IdentityRecord }
}

// A multi-select group (class, lane, ...): toggles one value, and drops the field when it empties.
export function toggleInList(c: Champion, field: 'class' | 'role' | 'attack_type' | 'playstyle', value: string): Champion {
  const current = c.identity[field] ?? []
  const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
  return setIdentity(c, { [field]: next.length > 0 ? next : undefined })
}

export function setResource(c: Champion, value: string): Champion {
  return setIdentity(c, { resource_type: c.identity.resource_type === value ? undefined : value })
}

export function addTag(c: Champion, raw: string): Champion {
  const tag = raw.trim().toLowerCase().slice(0, 40)
  if (!tag || c.tags.includes(tag) || c.tags.length >= 50) return c
  return { ...c, tags: [...c.tags, tag] }
}

export function removeTag(c: Champion, tag: string): Champion {
  return { ...c, tags: c.tags.filter(t => t !== tag) }
}

// ─── Abilities ───────────────────────────────────────────────────────────────

// An empty field is stored as absent, so "" and undefined are the same champion.
function clean<T extends object>(value: T): T {
  const out = { ...value } as Record<string, unknown>
  for (const key of Object.keys(out)) if (out[key] === '' || out[key] === undefined) delete out[key]
  return out as T
}

export function setAbility(c: Champion, slot: AbilitySlot, patch: Partial<AbilityText>): Champion {
  return { ...c, abilities: { ...c.abilities, [slot]: clean({ ...c.abilities[slot], ...patch }) } }
}

export function addPart(c: Champion, slot: AbilitySlot, kind: BlockKind = 'alternate_form'): { champion: Champion; id: string } {
  const id = newId()
  const blocks = c.abilities[slot].blocks ?? []
  return { champion: setAbility(c, slot, { blocks: [...blocks, { id, kind }] }), id }
}

export function setPart(c: Champion, slot: AbilitySlot, id: string, patch: Partial<Omit<BlockText, 'id'>>): Champion {
  const blocks = (c.abilities[slot].blocks ?? []).map(b => (b.id === id ? clean({ ...b, ...patch }) as BlockText : b))
  return setAbility(c, slot, { blocks })
}

export function removePart(c: Champion, slot: AbilitySlot, id: string): Champion {
  const blocks = (c.abilities[slot].blocks ?? []).filter(b => b.id !== id)
  return setAbility(c, slot, { blocks: blocks.length > 0 ? blocks : undefined })
}

// Which keys have anything written, for the dots on the key strip.
export function filledSlots(c: Champion): AbilitySlot[] {
  return SLOTS.filter(slot => {
    const a = c.abilities[slot]
    return !!(a.name || a.description || a.icon || a.blocks?.length)
  })
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export function journalTabs(c: Champion, slot: AbilitySlot): JournalTab[] {
  return c.abilities[slot].journal?.tabs ?? []
}

function withTabs(c: Champion, slot: AbilitySlot, tabs: JournalTab[]): Champion {
  return setAbility(c, slot, { journal: tabs.length > 0 ? { tabs } : undefined })
}

export function addJournalTab(c: Champion, slot: AbilitySlot, now: string = new Date().toISOString()): { champion: Champion; id: string } {
  const tabs = journalTabs(c, slot)
  const id = newId()
  return { champion: withTabs(c, slot, [...tabs, { id, name: `Note ${tabs.length + 1}`, content: '', created_at: now }]), id }
}

export function updateJournalTab(c: Champion, slot: AbilitySlot, id: string, patch: Partial<Pick<JournalTab, 'name' | 'content'>>): Champion {
  return withTabs(c, slot, journalTabs(c, slot).map(t => (t.id === id ? { ...t, ...patch } : t)))
}

export function removeJournalTab(c: Champion, slot: AbilitySlot, id: string): Champion {
  return withTabs(c, slot, journalTabs(c, slot).filter(t => t.id !== id))
}
