import { useEffect, useRef, useState } from 'react'
import type { AbilitySlot, BlockKind } from '../../interchange/types'
import { SLOTS } from '../../interchange/types'
import { addPart, filledSlots, KIND_LABEL, removePart, setAbility, setPart, SLOT_LABEL, SLOT_TYPE } from '../../model/champion'
import { fileToImageRef, imageUrl } from '../../logic/image'
import AutoTextarea from '../../ui/AutoTextarea'
import ConfirmSheet from '../../ui/ConfirmSheet'
import Sheet from '../../ui/Sheet'
import { ImageIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { useToast } from '../../ui/Toast'
import type { TabProps } from './types'

const KINDS: BlockKind[] = ['passive', 'alternate_form', 'recast']

interface Props extends TabProps {
  slot: AbilitySlot
  onSlot: (slot: AbilitySlot) => void
}

export default function AbilitiesTab({ champion, change, slot, onSlot }: Props) {
  const ability = champion.abilities[slot]
  const parts = ability.blocks ?? []
  const filled = filledSlots(champion)
  const [partId, setPartId] = useState<string | null>(null) // null = the ability itself
  const [iconSheet, setIconSheet] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast(s => s.show)

  // A different key starts on its own main part; a removed part falls back to Main.
  useEffect(() => { setPartId(null) }, [slot])
  const part = partId ? parts.find(p => p.id === partId) : undefined
  useEffect(() => { if (partId && !part) setPartId(null) }, [partId, part])

  async function onIcon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const icon = await fileToImageRef(file, 'icon')
      change(c => setAbility(c, slot, { icon }))
    } catch (err) {
      toast((err as Error).message || 'That image could not be used.')
    }
  }

  function addNewPart() {
    let created = ''
    change(c => { const r = addPart(c, slot, 'alternate_form'); created = r.id; return r.champion })
    setPartId(created)
  }

  const iconUrl = imageUrl(ability.icon)

  return (
    <div className="tab-body abilities">
      <div className="keystrip" role="tablist" aria-label="Ability">
        {SLOTS.map(s => {
          const icon = imageUrl(champion.abilities[s].icon)
          return (
            <button
              key={s}
              role="tab"
              aria-selected={slot === s}
              aria-label={SLOT_TYPE[s]}
              className={`key${slot === s ? ' on' : ''}${filled.includes(s) ? ' filled' : ''}`}
              onClick={() => onSlot(s)}
            >
              {icon ? <img src={icon} alt="" draggable={false} /> : SLOT_LABEL[s]}
            </button>
          )
        })}
      </div>

      <div className="partsrow" role="tablist" aria-label="Parts of this ability">
        <button role="tab" aria-selected={!partId} className={`chip${!partId ? ' on' : ''}`} onClick={() => setPartId(null)}>Main</button>
        {parts.map(p => (
          <button key={p.id} role="tab" aria-selected={partId === p.id} className={`chip${partId === p.id ? ' on' : ''}`} onClick={() => setPartId(p.id)}>
            {p.name || KIND_LABEL[p.kind]}
          </button>
        ))}
        <button className="chip add" aria-label="Add a part" onClick={addNewPart}><PlusIcon size={16} /> Part</button>
      </div>

      {!part && (
        <div className="editor">
          <div className="name-row">
            <button className="icon-tile" aria-label="Ability icon" onClick={() => (iconUrl ? setIconSheet(true) : fileRef.current?.click())}>
              {iconUrl ? <img src={iconUrl} alt="" draggable={false} /> : <ImageIcon size={22} />}
            </button>
            <input
              className="field name-field"
              placeholder={`${SLOT_TYPE[slot]} name`}
              value={ability.name ?? ''}
              maxLength={80}
              onChange={e => change(c => setAbility(c, slot, { name: e.target.value }))}
            />
          </div>
          <AutoTextarea
            value={ability.description ?? ''}
            placeholder="What does it do?"
            maxLength={4000}
            onChange={e => change(c => setAbility(c, slot, { description: e.target.value }))}
          />
        </div>
      )}

      {part && (
        <div className="editor">
          <div>
            <div className="field-label">Kind</div>
            <div className="chips">
              {KINDS.map(k => (
                <button key={k} className={`chip${part.kind === k ? ' on' : ''}`} onClick={() => change(c => setPart(c, slot, part.id, { kind: k }))}>{KIND_LABEL[k]}</button>
              ))}
            </div>
          </div>
          <input
            className="field name-field"
            placeholder="Name"
            value={part.name ?? ''}
            maxLength={80}
            onChange={e => change(c => setPart(c, slot, part.id, { name: e.target.value }))}
          />
          <AutoTextarea
            value={part.description ?? ''}
            placeholder="What does this part do?"
            maxLength={4000}
            onChange={e => change(c => setPart(c, slot, part.id, { description: e.target.value }))}
          />
          {part.kind === 'recast' && (
            <input
              className="field"
              placeholder="When it unlocks (for example: after Q hits an enemy)"
              value={part.condition ?? ''}
              maxLength={200}
              onChange={e => change(c => setPart(c, slot, part.id, { condition: e.target.value }))}
            />
          )}
          <button className="link-danger" onClick={() => setRemoving(true)}><TrashIcon size={18} /> Remove this part</button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onIcon} />
      <Sheet open={iconSheet} onClose={() => setIconSheet(false)} title="Ability icon">
        <button className="sheet-action" onClick={() => { setIconSheet(false); fileRef.current?.click() }}><ImageIcon /> Choose a different image</button>
        <button className="sheet-action danger" onClick={() => { setIconSheet(false); change(c => setAbility(c, slot, { icon: undefined })) }}><TrashIcon /> Remove</button>
        <p className="muted">The icon belongs to the key, so it is shared by the ability and all of its parts.</p>
      </Sheet>
      <ConfirmSheet
        open={removing}
        title="Remove this part?"
        message="This part's name and description are deleted from the ability."
        confirmLabel="Remove"
        danger
        onCancel={() => setRemoving(false)}
        onConfirm={() => { setRemoving(false); if (part) change(c => removePart(c, slot, part.id)) }}
      />
    </div>
  )
}
