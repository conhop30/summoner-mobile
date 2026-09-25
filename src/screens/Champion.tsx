import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { AbilitySlot } from '../interchange/types'
import { setIdentity } from '../model/champion'
import { useLibrary } from '../store/library'
import { useSettings } from '../store/settings'
import { exportChampions } from '../logic/exportAction'
import { useKeyboard } from '../platform/keyboard'
import { Drawer, isTabKey, TabBar, type TabKey } from '../ui/Nav'
import FloatingWidget from '../ui/FloatingWidget'
import Menu from '../ui/Menu'
import ConfirmSheet from '../ui/ConfirmSheet'
import { useToast } from '../ui/Toast'
import { BackIcon, BookIcon, MenuIcon, MoreIcon, PlayIcon, ShareIcon, TrashIcon } from '../ui/icons'
import JournalSheet from '../sheets/JournalSheet'
import StoryTab from './tabs/StoryTab'
import IdentityTab from './tabs/IdentityTab'
import AbilitiesTab from './tabs/AbilitiesTab'
import './Champion.css'

const HEADER_H = 84
const NAV_H = 56

export default function ChampionScreen() {
  const { id = '', tab } = useParams()
  const navigate = useNavigate()
  const champion = useLibrary(s => s.champions.find(c => c.id === id))
  const loaded = useLibrary(s => s.loaded)
  const edit = useLibrary(s => s.edit)
  const remove = useLibrary(s => s.remove)
  const navStyle = useSettings(s => s.navStyle)
  const toast = useToast(s => s.show)
  const typing = useKeyboard(s => s.height > 0)

  const [slot, setSlot] = useState<AbilitySlot>('passive')
  const [journalOpen, setJournalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const change = useMemo(() => (fn: Parameters<typeof edit>[1]) => edit(id, fn), [edit, id])

  if (!isTabKey(tab)) return <Navigate to={`/c/${id}/story`} replace />
  if (loaded && !champion) return <Navigate to="/" replace />
  if (!champion) return <div className="screen" />

  const current: TabKey = tab
  const go = (key: TabKey) => navigate(`/c/${id}/${key}`, { replace: true })
  const present = () => navigate(`/present/${id}`)

  return (
    <div className="screen champion">
      <header className="appbar champion-bar">
        {navStyle === 'drawer'
          ? <button className="icon-btn" aria-label="Menu" onClick={() => setDrawerOpen(true)}><MenuIcon /></button>
          : <button className="icon-btn" aria-label="Back to the gallery" onClick={() => navigate('/')}><BackIcon /></button>}
        <div className="namebox">
          <input
            className="name-input"
            aria-label="Champion name"
            placeholder="Champion name"
            value={champion.identity.name}
            maxLength={80}
            onChange={e => change(c => setIdentity(c, { name: e.target.value }))}
            onBlur={e => { if (!e.target.value.trim()) change(c => setIdentity(c, { name: 'Untitled champion' })) }}
          />
          <input
            className="title-input"
            aria-label="Title"
            placeholder="Title"
            value={champion.identity.title ?? ''}
            maxLength={120}
            onChange={e => change(c => setIdentity(c, { title: e.target.value }))}
          />
        </div>
        <button className="icon-btn" aria-label="Present" onClick={present}><PlayIcon /></button>
        <button className="icon-btn" aria-label="More" onClick={() => setMenuOpen(true)}><MoreIcon /></button>
      </header>

      <main className="scroll champion-scroll">
        {current === 'story' && <StoryTab champion={champion} change={change} />}
        {current === 'identity' && <IdentityTab champion={champion} change={change} />}
        {current === 'abilities' && <AbilitiesTab champion={champion} change={change} slot={slot} onSlot={setSlot} />}
      </main>

      {navStyle === 'bottom' && !typing && <TabBar current={current} onSelect={go} />}

      <FloatingWidget
        topInset={HEADER_H}
        bottomInset={navStyle === 'bottom' ? NAV_H : 8}
        hidden={typing}
        items={[{ key: 'journal', label: 'Journal', hint: 'Notes on each ability', icon: <BookIcon />, onSelect: () => setJournalOpen(true) }]}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={current}
        onSelect={go}
        title={champion.identity.name || 'Champion'}
        onPresent={present}
        footer={<button className="drawer-item" onClick={() => { setDrawerOpen(false); navigate('/') }}><BackIcon size={18} /> Gallery</button>}
      />

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            key: 'export', label: 'Export this champion', icon: <ShareIcon />,
            onSelect: () => { exportChampions([champion]).then(ok => ok && toast('Exported.')).catch(() => toast('The export could not be shared.')) },
          },
          { key: 'delete', label: 'Delete', icon: <TrashIcon />, danger: true, onSelect: () => setDeleting(true) },
        ]}
      />

      <JournalSheet open={journalOpen} onClose={() => setJournalOpen(false)} champion={champion} slot={slot} onSlot={setSlot} change={change} />

      <ConfirmSheet
        open={deleting}
        title="Delete champion?"
        message={`${champion.identity.name} will be deleted from this phone. Export first if you want to keep it.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => { setDeleting(false); navigate('/', { replace: true }); void remove(champion.id) }}
      />
    </div>
  )
}
