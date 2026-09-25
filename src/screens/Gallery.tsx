import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXPORT_REMINDER_AFTER, useLibrary } from '../store/library'
import type { Champion } from '../model/champion'
import { imageUrl } from '../logic/image'
import { exportChampions } from '../logic/exportAction'
import { MAX_IMPORT_BYTES, planImport, type ImportPlan } from '../logic/transfer'
import { useLongPress } from '../hooks/useLongPress'
import Menu from '../ui/Menu'
import Sheet from '../ui/Sheet'
import ConfirmSheet from '../ui/ConfirmSheet'
import { useToast } from '../ui/Toast'
import { HexIcon, ImportIcon, MoreIcon, PlayIcon, PlusIcon, SearchIcon, ShareIcon, TrashIcon, CloseIcon } from '../ui/icons'
import ImportSheet from '../sheets/ImportSheet'
import AboutSheet from '../sheets/AboutSheet'
import NewChampionSheet from '../sheets/NewChampionSheet'
import './Gallery.css'

function Tile({ champion, onOpen, onHold }: { champion: Champion; onOpen: () => void; onHold: () => void }) {
  const press = useLongPress(onOpen, onHold)
  const { identity } = champion
  const pos = identity.image_position ?? { x: 50, y: 50 }
  const url = imageUrl(identity.splash)
  const tags = [...(identity.class ?? []), ...(identity.role ?? [])].slice(0, 3)
  return (
    <button className="tile" {...press} aria-label={identity.name}>
      <div className="tile-image">
        {url
          ? <img src={url} alt="" draggable={false} style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
          : <div className="tile-blank"><HexIcon size={34} /></div>}
      </div>
      <div className="tile-info">
        <div className="tile-name">{identity.name}</div>
        {identity.title && <div className="tile-title">{identity.title}</div>}
        {tags.length > 0 && <div className="tile-tags">{tags.join(' · ')}</div>}
      </div>
    </button>
  )
}

export default function Gallery() {
  const navigate = useNavigate()
  const champions = useLibrary(s => s.champions)
  const loaded = useLibrary(s => s.loaded)
  const create = useLibrary(s => s.create)
  const remove = useLibrary(s => s.remove)
  const editsSinceExport = useLibrary(s => s.editsSinceExport)
  const toast = useToast(s => s.show)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [held, setHeld] = useState<Champion | null>(null)
  const [deleting, setDeleting] = useState<Champion | null>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [planFile, setPlanFile] = useState('')
  const [reminderHidden, setReminderHidden] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? champions.filter(c => c.identity.name.toLowerCase().includes(q)) : champions
  }, [champions, query])

  async function doExport(list: Champion[]) {
    try {
      const message = await exportChampions(list)
      if (message) toast(message)
    } catch {
      toast('The export could not be shared.')
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) { toast('That file is too large to import.'); return }
    try {
      const result = planImport(await file.text(), champions)
      if (!result.ok) { toast(result.error); return }
      setPlanFile(file.name)
      setPlan(result)
    } catch {
      toast('That file could not be read.')
    }
  }

  const showReminder = !reminderHidden && champions.length > 0 && editsSinceExport >= EXPORT_REMINDER_AFTER

  return (
    <div className="screen gallery">
      <header className="appbar">
        {searchOpen ? (
          <>
            <input
              className="search-input"
              autoFocus
              placeholder="Find a champion"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="icon-btn" aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery('') }}><CloseIcon /></button>
          </>
        ) : (
          <>
            <div className="brand"><HexIcon size={22} /><span>Summoner Mobile</span></div>
            <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}><SearchIcon /></button>
            <button className="icon-btn" aria-label="More" onClick={() => setMenuOpen(true)}><MoreIcon /></button>
          </>
        )}
      </header>

      <main className="scroll">
        {showReminder && (
          <div className="reminder">
            <span>You've made changes since your last export. Champions live only on this phone.</span>
            <button className="chip" onClick={() => doExport(champions)}>Export</button>
            <button className="icon-btn small" aria-label="Dismiss" onClick={() => setReminderHidden(true)}><CloseIcon size={18} /></button>
          </div>
        )}

        {loaded && champions.length === 0 && (
          <div className="empty">
            <HexIcon size={44} />
            <p>No champions yet.</p>
            <button className="btn primary" onClick={() => setNewOpen(true)}>Create one</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Import from Summoner on your computer</button>
          </div>
        )}

        {shown.length > 0 && (
          <div className="grid">
            {shown.map(c => (
              <Tile key={c.id} champion={c} onOpen={() => navigate(`/c/${c.id}/story`)} onHold={() => setHeld(c)} />
            ))}
          </div>
        )}
        {champions.length > 0 && shown.length === 0 && <p className="muted center">No champion matches "{query}".</p>}
      </main>

      <button className="fab" aria-label="New champion" onClick={() => setNewOpen(true)}><PlusIcon size={26} /></button>

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { key: 'import', label: 'Import champions', icon: <ImportIcon />, onSelect: () => fileRef.current?.click() },
          { key: 'export', label: 'Export all', hint: champions.length === 0 ? 'Nothing to export yet' : undefined, icon: <ShareIcon />, onSelect: () => champions.length > 0 && doExport(champions) },
          { key: 'about', label: 'About and how transfer works', icon: <HexIcon />, onSelect: () => setAboutOpen(true) },
        ]}
      />

      <NewChampionSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={name => { setNewOpen(false); const c = create(name); navigate(`/c/${c.id}/story`) }}
      />

      <Sheet open={held !== null} onClose={() => setHeld(null)} title={held?.identity.name ?? ''}>
        {held && (
          <>
            <button className="sheet-action" onClick={() => { const id = held.id; setHeld(null); navigate(`/c/${id}/story`) }}><HexIcon /> Open</button>
            <button className="sheet-action" onClick={() => { const id = held.id; setHeld(null); navigate(`/present/${id}`) }}><PlayIcon /> Present</button>
            <button className="sheet-action" onClick={() => { const c = held; setHeld(null); void doExport([c]) }}><ShareIcon /> Export this champion</button>
            <button className="sheet-action danger" onClick={() => { setDeleting(held); setHeld(null) }}><TrashIcon /> Delete</button>
          </>
        )}
      </Sheet>

      <ConfirmSheet
        open={deleting !== null}
        title="Delete champion?"
        message={deleting ? `${deleting.identity.name} will be deleted from this phone. Export first if you want to keep it.` : ''}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => { if (deleting) void remove(deleting.id); setDeleting(null) }}
      />

      <ImportSheet
        plan={plan}
        fileName={planFile}
        onClose={() => setPlan(null)}
        onDone={message => { setPlan(null); toast(message) }}
        onError={message => { setPlan(null); toast(message) }}
      />

      <AboutSheet open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
