import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addPart, createChampion, setAbility, setIdentity, type Champion } from '../model/champion'
import { applyImport, buildExport, changeCount, classify, exportFileName, planImport } from './transfer'
import { parseInterchange } from '../interchange/sanitize'

const T1 = '2026-09-01T10:00:00.000Z'
const T2 = '2026-09-10T10:00:00.000Z'
const T3 = '2026-09-20T10:00:00.000Z'
const fixture = (name: string) => readFileSync(join(process.cwd(), 'contract', 'fixtures', name), 'utf-8')

function champ(over: Partial<Champion> = {}): Champion {
  return { ...createChampion('Nyxara', T2), id: '11111111-aaaa-4bbb-8ccc-222222222222', ...over }
}

describe('buildExport', () => {
  it('writes a concept file from this app', () => {
    const file = buildExport([champ()], T3)
    expect(file).toMatchObject({ format: 'summoner-export', version: 2, scope: 'concept', exported_at: T3, source: { app: 'summoner-mobile' } })
    expect(file.champions).toHaveLength(1)
    expect(file.champions[0]).not.toHaveProperty('desktop')
  })

  it('produces a file its own importer (and the desktop\'s) accepts unchanged', () => {
    let c = setIdentity(champ(), { title: 'The Lantern', lore: 'Story', class: ['Mage'] })
    c = setAbility(c, 'q', { name: 'Bolt', description: 'Fires.' })
    c = addPart(c, 'q', 'recast').champion
    const text = JSON.stringify(buildExport([c], T3))
    const plan = planImport(text, [])
    expect(plan.ok).toBe(true)
    if (plan.ok) {
      expect(plan.warnings).toEqual([])
      expect(plan.items[0].record).toMatchObject({ id: c.id, identity: { name: 'Nyxara', title: 'The Lantern' } })
      expect(plan.items[0].record.abilities.q.blocks).toHaveLength(1)
    }
  })

  it('exports a nameless draft as "Untitled champion" instead of dropping it', () => {
    const file = buildExport([champ({ identity: { name: '   ' } })], T3)
    expect(file.champions[0].identity.name).toBe('Untitled champion')
  })

  it('names the file after the champion when there is one, else by date', () => {
    const day = new Date('2026-09-24T12:00:00Z')
    expect(exportFileName([champ({ identity: { name: 'Nyx Ara!' } })], day)).toBe('summoner-nyx-ara-2026-09-24.json')
    expect(exportFileName([champ(), champ()], day)).toBe('summoner-mobile-2026-09-24.json')
  })
})

describe('classify', () => {
  const record = (stamp: string) => ({ ...champ(), concept_updated_at: stamp })
  it('compares concept stamps', () => {
    expect(classify(undefined, record(T2))).toBe('new')
    expect(classify(champ(), record(T2))).toBe('unchanged')
    expect(classify(champ(), record(T3))).toBe('update')
    expect(classify(champ(), record(T1))).toBe('local-newer')
  })
})

describe('planImport and applyImport', () => {
  const fileFor = (records: Champion[]) => JSON.stringify({ format: 'summoner-export', version: 2, scope: 'concept', exported_at: T3, champions: records })

  it('refuses files that are not exports, with a readable reason', () => {
    for (const [name, error] of [['bad-not-json.json', 'not valid JSON'], ['bad-other-format.json', 'not a Summoner export'], ['bad-future-version.json', 'newer version']] as const) {
      const plan = planImport(fixture(name), [])
      expect(plan.ok).toBe(false)
      if (!plan.ok) expect(plan.error).toContain(error)
    }
  })

  it('reads a desktop "export for mobile" file and drops the desktop-only part of a full backup', () => {
    const full = planImport(fixture('full-with-stats.json'), [])
    expect(full.ok).toBe(true)
    if (full.ok) {
      expect(full.scope).toBe('full')
      expect(full.items[0].record).not.toHaveProperty('desktop')
      expect(full.items[0].record.abilities.q.blocks).toHaveLength(2) // parts survive, their numbers do not
    }
  })

  it('reports skipped and trimmed items instead of hiding them', () => {
    const plan = planImport(fixture('hostile-records.json'), [])
    expect(plan.ok && plan.items.length).toBe(1)
    expect(plan.ok && plan.warnings.length).toBe(6)
  })

  it('adds new champions, updates ones that are older here, and leaves the rest', () => {
    const mine = champ()
    const older = { ...champ({ id: '33333333-aaaa-4bbb-8ccc-444444444444', concept_updated_at: T1 }), identity: { name: 'Older here' } }
    const newer = { ...champ({ id: '55555555-aaaa-4bbb-8ccc-666666666666', concept_updated_at: T3 }), identity: { name: 'Newer here' } }
    const incoming = [
      { ...mine },                                                                                   // same
      { ...older, concept_updated_at: T3, identity: { name: 'Older here, edited on desktop' } },      // update
      { ...newer, concept_updated_at: T1, identity: { name: 'Newer here, stale in file' } },          // local-newer
      { ...champ({ id: '77777777-aaaa-4bbb-8ccc-888888888888' }), identity: { name: 'Brand new' } },  // new
    ]
    const plan = planImport(fileFor(incoming), [mine, older, newer])
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.items.map(i => i.status)).toEqual(['unchanged', 'update', 'local-newer', 'new'])

    const keepMine = applyImport(plan, 'keep-mine')
    expect(keepMine).toMatchObject({ added: 1, updated: 1, copies: 0, skipped: 2 })
    expect(keepMine.champions.map(c => c.identity.name)).toEqual(['Older here, edited on desktop', 'Brand new'])

    const takeTheirs = applyImport(plan, 'take-theirs')
    expect(takeTheirs.champions.map(c => c.identity.name)).toContain('Newer here, stale in file')
    expect(takeTheirs).toMatchObject({ added: 1, updated: 2, skipped: 1 })

    const both = applyImport(plan, 'keep-both')
    const copy = both.champions.find(c => c.identity.name === 'Newer here, stale in file (imported)')!
    expect(copy.id).not.toBe(newer.id)
    expect(both).toMatchObject({ added: 1, updated: 1, copies: 1, skipped: 1 })

    expect(changeCount(plan, 'keep-mine')).toBe(2)
    expect(changeCount(plan, 'take-theirs')).toBe(3)
    expect(changeCount(plan, 'keep-both')).toBe(3)
  })

  it('importing the same file twice changes nothing the second time', () => {
    const text = JSON.stringify(buildExport([champ()], T3))
    const first = planImport(text, [])
    if (!first.ok) throw new Error('plan failed')
    const written = applyImport(first, 'keep-mine').champions
    const second = planImport(text, written)
    expect(second.ok && second.items[0].status).toBe('unchanged')
  })

  it('an imported champion keeps the stamp from the file, so it is not falsely newer', () => {
    const plan = planImport(JSON.stringify(buildExport([champ()], T3)), [])
    if (!plan.ok) throw new Error('plan failed')
    expect(applyImport(plan, 'keep-mine').champions[0].concept_updated_at).toBe(T2)
  })

  it('round-trips through the shared parser without warnings', () => {
    const parsed = parseInterchange(JSON.parse(JSON.stringify(buildExport([champ()], T3))))
    expect(parsed.ok && parsed.file.warnings).toEqual([])
  })
})
