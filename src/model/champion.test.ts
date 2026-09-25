import { describe, expect, it } from 'vitest'
import {
  addJournalTab, addPart, addTag, applyEdit, contentKey, createChampion, filledSlots, journalTabs, removeJournalTab,
  removePart, removeTag, setAbility, setIdentity, setPart, setResource, toggleInList, updateJournalTab,
} from './champion'

const T0 = '2026-09-01T10:00:00.000Z'
const T1 = '2026-09-02T10:00:00.000Z'
const make = () => createChampion('Nyxara', T0)

describe('createChampion', () => {
  it('starts with a name, five empty abilities and the creation time as its stamp', () => {
    const c = make()
    expect(c.identity).toEqual({ name: 'Nyxara' })
    expect(Object.keys(c.abilities).sort()).toEqual(['e', 'passive', 'q', 'r', 'w'])
    expect(c.concept_updated_at).toBe(T0)
    expect(c.created_at).toBe(T0)
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('applyEdit', () => {
  it('moves the stamp when something changed', () => {
    const next = applyEdit(make(), c => setIdentity(c, { title: 'The Lantern' }), T1)
    expect(next.concept_updated_at).toBe(T1)
    expect(next.identity.title).toBe('The Lantern')
  })

  it('leaves the champion (and its stamp) alone when the edit changes nothing', () => {
    const c = make()
    expect(applyEdit(c, x => setIdentity(x, { name: 'Nyxara' }), T1)).toBe(c)
    expect(applyEdit(c, x => setAbility(x, 'q', { name: '' }), T1)).toBe(c)
  })

  it('does not treat key order as a change', () => {
    const c = setIdentity(make(), { title: 'T', lore: 'L' })
    const reordered = { ...c, identity: { lore: 'L', title: 'T', name: 'Nyxara' } }
    expect(contentKey(reordered)).toBe(contentKey(c))
  })
})

describe('identity', () => {
  it('toggles list values on and off, and drops an emptied field', () => {
    let c = toggleInList(make(), 'class', 'Mage')
    c = toggleInList(c, 'class', 'Support')
    expect(c.identity.class).toEqual(['Mage', 'Support'])
    c = toggleInList(toggleInList(c, 'class', 'Mage'), 'class', 'Support')
    expect(c.identity).not.toHaveProperty('class')
  })

  it('resource is single choice: picking again clears it', () => {
    const c = setResource(make(), 'Mana')
    expect(c.identity.resource_type).toBe('Mana')
    expect(setResource(setResource(c, 'Energy'), 'Energy').identity.resource_type).toBeUndefined()
  })

  it('tags are trimmed, lower-cased, unique and removable', () => {
    let c = addTag(make(), '  Fox ')
    c = addTag(c, 'fox')
    c = addTag(c, '   ')
    expect(c.tags).toEqual(['fox'])
    expect(removeTag(c, 'fox').tags).toEqual([])
  })
})

describe('abilities and parts', () => {
  it('stores an empty field as absent', () => {
    const c = setAbility(setAbility(make(), 'q', { name: 'Bolt', description: 'Fires.' }), 'q', { description: '' })
    expect(c.abilities.q).toEqual({ name: 'Bolt' })
  })

  it('adds parts with their own ids, edits them by id and removes them', () => {
    const a = addPart(make(), 'q', 'alternate_form')
    const b = addPart(a.champion, 'q', 'recast')
    expect(a.id).not.toBe(b.id)
    expect(b.champion.abilities.q.blocks?.map(p => p.kind)).toEqual(['alternate_form', 'recast'])

    const named = setPart(b.champion, 'q', a.id, { name: 'Mega Bolt', description: 'Bigger.' })
    expect(named.abilities.q.blocks?.[0]).toMatchObject({ id: a.id, name: 'Mega Bolt', description: 'Bigger.' })
    expect(named.abilities.q.blocks?.[1]).toEqual({ id: b.id, kind: 'recast' })

    const cleared = setPart(named, 'q', a.id, { description: '' })
    expect(cleared.abilities.q.blocks?.[0]).not.toHaveProperty('description')

    const removed = removePart(removePart(named, 'q', a.id), 'q', b.id)
    expect(removed.abilities.q).not.toHaveProperty('blocks')
  })

  it('changing a part\'s kind and recast condition works', () => {
    const { champion, id } = addPart(make(), 'e', 'passive')
    const recast = setPart(champion, 'e', id, { kind: 'recast', condition: 'after E hits' })
    expect(recast.abilities.e.blocks?.[0]).toEqual({ id, kind: 'recast', condition: 'after E hits' })
  })

  it('reports which keys have content, counting parts', () => {
    let c = setAbility(make(), 'q', { name: 'Bolt' })
    c = addPart(c, 'r').champion
    expect(filledSlots(c)).toEqual(['q', 'r'])
  })
})

describe('journal', () => {
  it('adds, renames, writes in and removes notes per ability', () => {
    const a = addJournalTab(make(), 'w', T1)
    expect(journalTabs(a.champion, 'w')).toEqual([{ id: a.id, name: 'Note 1', content: '', created_at: T1 }])
    expect(journalTabs(a.champion, 'q')).toEqual([])

    const b = addJournalTab(a.champion, 'w', T1)
    expect(journalTabs(b.champion, 'w')[1].name).toBe('Note 2')

    const written = updateJournalTab(b.champion, 'w', a.id, { name: 'Scrapped', content: 'It used to stun.' })
    expect(journalTabs(written, 'w')[0]).toMatchObject({ name: 'Scrapped', content: 'It used to stun.' })

    const removed = removeJournalTab(removeJournalTab(written, 'w', a.id), 'w', b.id)
    expect(removed.abilities.w).not.toHaveProperty('journal')
  })
})
