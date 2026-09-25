import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { AbilitySlot } from '../interchange/types'
import { SLOTS } from '../interchange/types'
import { filledSlots, KIND_LABEL, SLOT_LABEL, SLOT_TYPE } from '../model/champion'
import { imageUrl } from '../logic/image'
import { enterImmersive, exitImmersive, onImmersiveExit } from '../platform'
import { useLibrary } from '../store/library'
import { CloseIcon } from '../ui/icons'
import './Present.css'

const PAGES = ['Cover', 'Lore', 'Abilities'] as const
const OVERLAY_MS = 2600

// The champion as a card you can hand to someone: full screen, no bars, swipe between three pages.
export default function Present() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const champion = useLibrary(s => s.champions.find(c => c.id === id))
  const loaded = useLibrary(s => s.loaded)

  const [page, setPage] = useState(0)
  const [overlay, setOverlay] = useState(false)
  const [slot, setSlot] = useState<AbilitySlot | null>(null)
  const [partId, setPartId] = useState<string | null>(null)
  const pager = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void enterImmersive()
    // Leaving fullscreen with Back or the edge swipe (web) leaves Present too.
    const stop = onImmersiveExit(() => navigate(-1))
    return () => { stop(); void exitImmersive() }
  }, [navigate])

  const showOverlay = useCallback(() => {
    setOverlay(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setOverlay(false), OVERLAY_MS)
  }, [])
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  if (loaded && !champion) return <Navigate to="/" replace />
  if (!champion) return <div className="present" />

  const { identity } = champion
  const pos = identity.image_position ?? { x: 50, y: 50 }
  const bg = imageUrl(identity.splash)
  const tags = [...(identity.class ?? []), ...(identity.role ?? []), ...(identity.attack_type ?? [])]
  const filled = filledSlots(champion)
  const shownSlot = slot && filled.includes(slot) ? slot : filled[0]
  const ability = shownSlot ? champion.abilities[shownSlot] : undefined
  const parts = ability?.blocks ?? []
  const part = partId ? parts.find(p => p.id === partId) : undefined

  function onScroll() {
    const el = pager.current
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  // A tap on the background (not on a button) shows the exit control for a moment.
  function onTap(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    showOverlay()
  }

  return (
    <div className="present" onClick={onTap}>
      {bg && <img className="present-bg" src={bg} alt="" draggable={false} style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />}
      <div className="present-shade" />

      <div className="pager" ref={pager} onScroll={onScroll}>
        <section className="page cover" aria-label="Cover">
          <div className="cover-text">
            <h1 className="cover-name">{identity.name}</h1>
            {identity.title && <div className="cover-title">{identity.title}</div>}
            {tags.length > 0 && <div className="cover-tags">{tags.map(t => <span key={t} className="cover-tag">{t}</span>)}</div>}
            {identity.playstyle && identity.playstyle.length > 0 && <div className="cover-playstyle">{identity.playstyle.join(' · ')}</div>}
          </div>
        </section>

        <section className="page lore" aria-label="Lore">
          <div className="page-scroll">
            <div className="page-heading">Lore</div>
            {identity.lore ? <p className="lore-text">{identity.lore}</p> : <p className="lore-empty">No lore written yet.</p>}
          </div>
        </section>

        <section className="page abilities" aria-label="Abilities">
          <div className="page-scroll">
            <div className="page-heading">Abilities</div>
            {filled.length === 0 && <p className="lore-empty">No abilities written yet.</p>}
            {filled.length > 0 && (
              <>
                <div className="present-keys">
                  {SLOTS.filter(s => filled.includes(s)).map(s => {
                    const icon = imageUrl(champion.abilities[s].icon)
                    return (
                      <div key={s} className="present-key-item">
                        <button className={`present-key${shownSlot === s ? ' on' : ''}`} aria-label={SLOT_TYPE[s]} onClick={() => { setSlot(s); setPartId(null) }}>
                          {icon ? <img src={icon} alt="" draggable={false} /> : SLOT_LABEL[s]}
                        </button>
                        <div className={`present-key-name${shownSlot === s ? ' on' : ''}`}>{champion.abilities[s].name}</div>
                      </div>
                    )
                  })}
                </div>

                {ability && shownSlot && (
                  <div className="spotlight">
                    <div className="spotlight-type">{part ? KIND_LABEL[part.kind] : SLOT_TYPE[shownSlot]}</div>
                    {parts.length > 0 && (
                      <div className="spotlight-parts">
                        <button className={`chip${!part ? ' on' : ''}`} onClick={() => setPartId(null)}>Main</button>
                        {parts.map(p => <button key={p.id} className={`chip${part?.id === p.id ? ' on' : ''}`} onClick={() => setPartId(p.id)}>{p.name || KIND_LABEL[p.kind]}</button>)}
                      </div>
                    )}
                    <div className="spotlight-name">{(part ? part.name : ability.name) || 'Unnamed'}</div>
                    {(part ? part.description : ability.description) && <p className="spotlight-desc">{part ? part.description : ability.description}</p>}
                    {part?.kind === 'recast' && part.condition && <p className="spotlight-condition">Unlocks {part.condition}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <div className="indicator" aria-hidden="true">
        <div className="indicator-label">{PAGES[page] ?? ''}</div>
        <div className="indicator-dots">{PAGES.map((p, i) => <span key={p} className={`dot${i === page ? ' on' : ''}`} />)}</div>
      </div>

      <button className={`present-exit${overlay ? ' show' : ''}`} aria-label="Close" onClick={() => navigate(-1)} tabIndex={overlay ? 0 : -1}>
        <CloseIcon />
      </button>
    </div>
  )
}
