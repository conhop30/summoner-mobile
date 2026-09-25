import { beforeEach, describe, expect, it } from 'vitest'
import { setAbility } from '../model/champion'
import { resetDbForTests, getAllChampions, getMeta } from './db'
import { useLibrary } from './library'

beforeEach(async () => {
  await resetDbForTests()
  useLibrary.setState({ champions: [], loaded: false, lastExportedAt: null, editsSinceExport: 0 })
})

describe('library', () => {
  it('creates a champion in memory at once and saves it on flush', async () => {
    const c = useLibrary.getState().create('Nyxara')
    expect(useLibrary.getState().champions[0].id).toBe(c.id)
    expect(await getAllChampions()).toHaveLength(0) // not yet: saving waits a moment
    await useLibrary.getState().flush()
    expect((await getAllChampions()).map(x => x.identity.name)).toEqual(['Nyxara'])
  })

  it('gives a nameless champion a name', () => {
    expect(useLibrary.getState().create('   ').identity.name).toBe('Untitled champion')
  })

  it('an edit updates the champion and moves its stamp; an edit that changes nothing does not', async () => {
    const c = useLibrary.getState().create('Nyxara')
    await useLibrary.getState().flush()
    const before = useLibrary.getState().champions[0]
    await new Promise(r => setTimeout(r, 5))

    useLibrary.getState().edit(c.id, x => setAbility(x, 'q', { name: 'Bolt' }))
    const after = useLibrary.getState().champions[0]
    expect(after.abilities.q.name).toBe('Bolt')
    expect(after.concept_updated_at > before.concept_updated_at).toBe(true)

    useLibrary.getState().edit(c.id, x => setAbility(x, 'q', { name: 'Bolt' }))
    expect(useLibrary.getState().champions[0]).toBe(after)
  })

  it('what was flushed comes back after a reload', async () => {
    const c = useLibrary.getState().create('Nyxara')
    useLibrary.getState().edit(c.id, x => setAbility(x, 'w', { name: 'Ward', description: 'Blocks.' }))
    await useLibrary.getState().flush()

    useLibrary.setState({ champions: [], loaded: false })
    await useLibrary.getState().load()
    const back = useLibrary.getState().champions[0]
    expect(back.identity.name).toBe('Nyxara')
    expect(back.abilities.w).toEqual({ name: 'Ward', description: 'Blocks.' })
  })

  it('removes a champion from memory and storage', async () => {
    const c = useLibrary.getState().create('Gone')
    await useLibrary.getState().flush()
    await useLibrary.getState().remove(c.id)
    expect(useLibrary.getState().champions).toHaveLength(0)
    expect(await getAllChampions()).toHaveLength(0)
  })

  it('writes imported champions, replacing any with the same id', async () => {
    const c = useLibrary.getState().create('Old name')
    await useLibrary.getState().flush()
    await useLibrary.getState().put([{ ...c, identity: { name: 'New name' } }])
    expect(useLibrary.getState().champions.map(x => x.identity.name)).toEqual(['New name'])
    expect((await getAllChampions()).map(x => x.identity.name)).toEqual(['New name'])
  })

  it('counts saved edits since the last export, and an export resets the count', async () => {
    const c = useLibrary.getState().create('Nyxara')
    await useLibrary.getState().flush()
    expect(useLibrary.getState().editsSinceExport).toBe(1)
    expect(await getMeta('edits_since_export')).toBe(1)
    useLibrary.getState().edit(c.id, x => setAbility(x, 'q', { name: 'Bolt' }))
    await useLibrary.getState().flush()
    expect(useLibrary.getState().editsSinceExport).toBe(2)

    await useLibrary.getState().markExported()
    expect(useLibrary.getState().editsSinceExport).toBe(0)
    expect(useLibrary.getState().lastExportedAt).not.toBeNull()
    expect(await getMeta('edits_since_export')).toBe(0)
  })
})
