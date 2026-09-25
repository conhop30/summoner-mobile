import { useState } from 'react'
import { addTag, removeTag, setResource, toggleInList } from '../../model/champion'
import type { TabProps } from './types'

const CLASSES = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank']
const ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']
const ATTACK_TYPES = ['Melee', 'Ranged']
const RESOURCES = ['Mana', 'Energy', 'Fury', 'Heat', 'None']
const PLAYSTYLES = ['Burst damage', 'Poke', 'Sustain', 'Engage', 'Peel', 'Skirmisher', 'Split push', 'Crowd control', 'Diver', 'Siege']

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="chips">{children}</div>
    </div>
  )
}

export default function IdentityTab({ champion, change }: TabProps) {
  const { identity, tags } = champion
  const [customPlaystyle, setCustomPlaystyle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const playstyle = identity.playstyle ?? []
  const customPlaystyles = playstyle.filter(p => !PLAYSTYLES.includes(p))

  function addPlaystyle() {
    const value = customPlaystyle.trim().slice(0, 40)
    if (!value) return
    if (!playstyle.includes(value)) change(c => toggleInList(c, 'playstyle', value))
    setCustomPlaystyle('')
  }

  function submitTag() {
    if (!tagInput.trim()) return
    change(c => addTag(c, tagInput))
    setTagInput('')
  }

  const pick = (field: 'class' | 'role' | 'attack_type', values: string[]) =>
    values.map(v => (
      <button key={v} className={`chip${identity[field]?.includes(v) ? ' on' : ''}`} onClick={() => change(c => toggleInList(c, field, v))}>{v}</button>
    ))

  return (
    <div className="tab-body">
      <Group label="Class">{pick('class', CLASSES)}</Group>
      <Group label="Lane">{pick('role', ROLES)}</Group>
      <Group label="Attack type">{pick('attack_type', ATTACK_TYPES)}</Group>
      <Group label="Resource">
        {RESOURCES.map(r => (
          <button key={r} className={`chip${identity.resource_type === r ? ' on' : ''}`} onClick={() => change(c => setResource(c, r))}>{r}</button>
        ))}
      </Group>

      <div>
        <div className="field-label">Playstyle</div>
        <div className="chips">
          {PLAYSTYLES.map(p => (
            <button key={p} className={`chip${playstyle.includes(p) ? ' on' : ''}`} onClick={() => change(c => toggleInList(c, 'playstyle', p))}>{p}</button>
          ))}
          {customPlaystyles.map(p => (
            <button key={p} className="chip on" onClick={() => change(c => toggleInList(c, 'playstyle', p))}>{p} ×</button>
          ))}
        </div>
        <div className="inline-add">
          <input
            className="field"
            placeholder="Custom playstyle"
            value={customPlaystyle}
            maxLength={40}
            enterKeyHint="done"
            onChange={e => setCustomPlaystyle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPlaystyle() }}
          />
          <button className="btn" onClick={addPlaystyle}>Add</button>
        </div>
      </div>

      <div>
        <div className="field-label">Tags</div>
        <div className="chips">
          {tags.map(t => <button key={t} className="chip on" onClick={() => change(c => removeTag(c, t))}>{t} ×</button>)}
        </div>
        <div className="inline-add">
          <input
            className="field"
            placeholder="Add a tag"
            value={tagInput}
            maxLength={40}
            enterKeyHint="done"
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitTag() }}
          />
          <button className="btn" onClick={submitTag}>Add</button>
        </div>
      </div>
    </div>
  )
}
