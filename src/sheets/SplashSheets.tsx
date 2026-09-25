import { useRef, useState, type PointerEvent } from 'react'
import Sheet from '../ui/Sheet'
import { ImageIcon, TrashIcon } from '../ui/icons'
import { galleryFrame, SPLASH_RECOMMENDED } from '../model/splashFrame'
import { imageUrl } from '../logic/image'
import type { ImageRef } from '../interchange/types'
import './SplashSheets.css'

// What to do with the splash art: choose, reposition, remove.
export function SplashActionsSheet(props: {
  open: boolean
  hasImage: boolean
  onClose: () => void
  onChoose: () => void
  onReposition: () => void
  onRemove: () => void
}) {
  const { open, hasImage, onClose, onChoose, onReposition, onRemove } = props
  return (
    <Sheet open={open} onClose={onClose} title="Splash art">
      <button className="sheet-action" onClick={() => { onClose(); onChoose() }}><ImageIcon /> {hasImage ? 'Choose a different image' : 'Choose an image'}</button>
      {hasImage && (
        <button className="sheet-action" onClick={() => { onClose(); onReposition() }}>
          <ImageIcon /> <span>Reposition<span className="sheet-action-hint">Choose what the gallery tile and Present keep</span></span>
        </button>
      )}
      {hasImage && <button className="sheet-action danger" onClick={() => { onClose(); onRemove() }}><TrashIcon /> Remove</button>}
      <p className="muted">
        Best: {SPLASH_RECOMMENDED.ratio} landscape, about {SPLASH_RECOMMENDED.width} × {SPLASH_RECOMMENDED.height} px. It is
        shrunk to fit when you pick it. The gallery tile and Present keep a tall strip, so keep your subject near the middle
        and reposition to fine-tune.
      </p>
    </Sheet>
  )
}

interface RepositionProps {
  open: boolean
  image: ImageRef | undefined
  position: { x: number; y: number }
  onCancel: () => void
  onDone: (position: { x: number; y: number }) => void
}

// Full screen: drag the image; the gold frame shows exactly what the gallery tile keeps.
export function RepositionSheet({ open, image, position, onCancel, onDone }: RepositionProps) {
  const [draft, setDraft] = useState(position)
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null)
  const [boxSize, setBoxSize] = useState<{ w: number; h: number } | null>(null)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number; w: number; h: number } | null>(null)
  const seeded = useRef(false)

  // Start from the saved position each time the sheet opens.
  if (open && !seeded.current) { seeded.current = true; setDraft(position) }
  if (!open && seeded.current) seeded.current = false

  const url = imageUrl(image)
  const frame = imageSize && boxSize ? galleryFrame(imageSize, boxSize, draft) : null

  function down(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    drag.current = { x: e.clientX, y: e.clientY, originX: draft.x, originY: draft.y, w: rect.width, h: rect.height }
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    const dx = ((e.clientX - d.x) / d.w) * 100
    const dy = ((e.clientY - d.y) / d.h) * 100
    setDraft({ x: Math.max(0, Math.min(100, d.originX - dx)), y: Math.max(0, Math.min(100, d.originY - dy)) })
  }

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      variant="full"
      title="Reposition"
      headerExtra={<button className="btn primary compact" onClick={() => onDone({ x: Math.round(draft.x * 10) / 10, y: Math.round(draft.y * 10) / 10 })}>Done</button>}
    >
      <p className="muted">Drag the image. The gold frame is what the gallery tile keeps.</p>
      <div
        className="reposition-box"
        ref={el => { if (el && (!boxSize || boxSize.w !== el.clientWidth || boxSize.h !== el.clientHeight)) setBoxSize({ w: el.clientWidth, h: el.clientHeight }) }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        {url && (
          <img
            src={url}
            alt=""
            draggable={false}
            style={{ objectPosition: `${draft.x}% ${draft.y}%` }}
            onLoad={e => setImageSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        )}
        {frame && <div className="reposition-frame" style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }} />}
      </div>
    </Sheet>
  )
}
