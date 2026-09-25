// Export and import, on the phone's side of the contract (contract/SPEC.md). Pure: no files, no
// storage. The same rule as the desktop applies: an import UPDATES champions it recognises, and
// asks about the ones that are newer here than in the file.

import { FORMAT, VERSION, type ChampionRecord, type ExportFile } from '../interchange/types'
import { parseInterchangeText, sanitizeRecord } from '../interchange/sanitize'
import { newId, type Champion } from '../model/champion'

export const MAX_IMPORT_BYTES = 60 * 1024 * 1024
export const APP_VERSION = '0.1.0'

// ─── Export ──────────────────────────────────────────────────────────────────

// Always a 'concept' file. Every champion goes through the same whitelist an importer applies, so
// what we write is exactly what the format allows (and a nameless draft is exported as "Untitled").
export function buildExport(champions: Champion[], now: string = new Date().toISOString()): ExportFile {
  const records: ChampionRecord[] = []
  for (const c of champions) {
    const named = c.identity.name.trim() ? c : { ...c, identity: { ...c.identity, name: 'Untitled champion' } }
    const record = sanitizeRecord(named, false, () => {})
    if (record) records.push(record)
  }
  return {
    format: FORMAT,
    version: VERSION,
    scope: 'concept',
    exported_at: now,
    source: { app: 'summoner-mobile', app_version: APP_VERSION },
    champions: records,
  }
}

export function exportFileName(champions: Champion[], now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  if (champions.length === 1) {
    const slug = champions[0].identity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'champion'
    return `summoner-${slug}-${day}.json`
  }
  return `summoner-mobile-${day}.json`
}

// ─── Import ──────────────────────────────────────────────────────────────────

export type ImportStatus = 'new' | 'update' | 'unchanged' | 'local-newer'
export type LocalNewerChoice = 'keep-mine' | 'take-theirs' | 'keep-both'

export interface PlanItem {
  record: ChampionRecord
  status: ImportStatus
  localAt?: string
}

export interface ImportPlan {
  ok: true
  scope: 'concept' | 'full'
  items: PlanItem[]
  warnings: string[]
}

export type PlanResult = ImportPlan | { ok: false; error: string }

export function classify(local: Champion | undefined, record: ChampionRecord): ImportStatus {
  if (!local) return 'new'
  const incoming = Date.parse(record.concept_updated_at)
  const mine = Date.parse(local.concept_updated_at)
  if (incoming === mine) return 'unchanged'
  return incoming > mine ? 'update' : 'local-newer'
}

export function planImport(text: string, local: Champion[]): PlanResult {
  // The phone has no use for the desktop's numbers, stats or builds: they are dropped here, not stored.
  const parsed = parseInterchangeText(text, { includeDesktop: false, maxBytes: MAX_IMPORT_BYTES })
  if (!parsed.ok) return { ok: false, error: parsed.error }
  const { records, warnings, scope } = parsed.file
  if (records.length === 0) return { ok: false, error: warnings[0] ?? 'This file has no champions in it' }
  const byId = new Map(local.map(c => [c.id, c]))
  const items = records.map(record => {
    const mine = byId.get(record.id)
    return { record, status: classify(mine, record), localAt: mine?.concept_updated_at }
  })
  return { ok: true, scope, items, warnings }
}

export interface ImportOutcome {
  champions: Champion[]
  added: number
  updated: number
  copies: number
  skipped: number
}

function toChampion(record: ChampionRecord): Champion {
  const { desktop: _desktop, ...champion } = record
  void _desktop
  return champion
}

// Works out what to write. Nothing is written here: the caller stores `champions`.
export function applyImport(plan: ImportPlan, choice: LocalNewerChoice): ImportOutcome {
  const out: ImportOutcome = { champions: [], added: 0, updated: 0, copies: 0, skipped: 0 }
  for (const { record, status } of plan.items) {
    if (status === 'unchanged' || (status === 'local-newer' && choice === 'keep-mine')) { out.skipped++; continue }
    if (status === 'local-newer' && choice === 'keep-both') {
      const copy = toChampion(record)
      out.champions.push({ ...copy, id: newId(), identity: { ...copy.identity, name: `${copy.identity.name} (imported)`.slice(0, 80) } })
      out.copies++
      continue
    }
    out.champions.push(toChampion(record))
    if (status === 'new') out.added++
    else out.updated++
  }
  return out
}

// How many champions an import would actually change with a given choice (for the button label).
export function changeCount(plan: ImportPlan, choice: LocalNewerChoice): number {
  return plan.items.filter(i => i.status === 'new' || i.status === 'update' || (i.status === 'local-newer' && choice !== 'keep-mine')).length
}
