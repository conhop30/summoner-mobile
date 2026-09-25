import { useEffect, useState } from 'react'
import type { AbilitySlot } from '../interchange/types'
import { SLOTS } from '../interchange/types'
import { addJournalTab, journalTabs, removeJournalTab, SLOT_LABEL, SLOT_TYPE, updateJournalTab, type Champion } from '../model/champion'
import AutoTextarea from '../ui/AutoTextarea'
import ConfirmSheet from '../ui/ConfirmSheet'
import Sheet from '../ui/Sheet'
import { PlusIcon, TrashIcon } from '../ui/icons'
import './JournalSheet.css'

interface Props {
  open: boolean
  onClose: () => void
  champion: Champion
  slot: AbilitySlot
  onSlot: (slot: AbilitySlot) => void
  change: (edit: (c: Champion) => Champion) => void
}

// Design notes for one ability: scrapped ideas, things to revisit. Full screen, so there is room to write.
export default function JournalSheet({ open, onClose, champion, slot, onSlot, change }: Props) {
  const tabs = journalTabs(champion, slot)
  const [tabId, setTabId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Land on the first note of whichever key is showing, and fall back if the open note goes away.
  const current = tabs.find(t => t.id === tabId) ?? tabs[0]
  useEffect(() => { setTabId(null) }, [slot, open])

  function addNote() {
    let created = ''
    change(c => { const r = addJournalTab(c, slot); created = r.id; return r.champion })
    setTabId(created)
  }

  return (
    <Sheet open={open} onClose={onClose} variant="full" title="Journal">
      <div className="journal-keys" role="tablist" aria-label="Ability">
        {SLOTS.map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={slot === s}
            aria-label={SLOT_TYPE[s]}
            className={`key small${slot === s ? ' on' : ''}${journalTabs(champion, s).length > 0 ? ' filled' : ''}`}
            onClick={() => onSlot(s)}
          >
            {SLOT_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="journal-tabs" role="tablist" aria-label="Notes">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={current?.id === t.id} className={`chip${current?.id === t.id ? ' on' : ''}`} onClick={() => setTabId(t.id)}>
            {t.name || 'Untitled'}
          </button>
        ))}
        <button className="chip add" aria-label="Add a note" onClick={addNote}><PlusIcon size={16} /> Note</button>
      </div>

      {current ? (
        <div className="journal-note">
          <input
            className="field"
            placeholder="Note title"
            value={current.name}
            maxLength={60}
            onChange={e => change(c => updateJournalTab(c, slot, current.id, { name: e.target.value }))}
          />
          <AutoTextarea
            className="journal-text"
            value={current.content}
            placeholder="Scrapped mechanics, rough ideas, things to revisit…"
            maxLength={20000}
            onChange={e => change(c => updateJournalTab(c, slot, current.id, { content: e.target.value }))}
          />
          <button className="link-danger" onClick={() => setDeleting(true)}><TrashIcon size={18} /> Delete this note</button>
        </div>
      ) : (
        <div className="journal-empty">
          <p>No notes on {SLOT_TYPE[slot]} yet.</p>
          <button className="btn primary" onClick={addNote}>Add a note</button>
        </div>
      )}

      <ConfirmSheet
        open={deleting}
        title="Delete this note?"
        message="The note and everything written in it will be deleted."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => { setDeleting(false); if (current) change(c => removeJournalTab(c, slot, current.id)) }}
      />
    </Sheet>
  )
}
