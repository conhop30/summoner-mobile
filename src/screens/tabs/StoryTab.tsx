import { useRef, useState } from 'react'
import type { Champion } from '../../model/champion'
import { setIdentity } from '../../model/champion'
import { fileToImageRef, imageUrl } from '../../logic/image'
import AutoTextarea from '../../ui/AutoTextarea'
import { ImageIcon } from '../../ui/icons'
import { useToast } from '../../ui/Toast'
import { RepositionSheet, SplashActionsSheet } from '../../sheets/SplashSheets'
import type { TabProps } from './types'

export default function StoryTab({ champion, change }: TabProps) {
  const { identity } = champion
  const fileRef = useRef<HTMLInputElement>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [repositionOpen, setRepositionOpen] = useState(false)
  const toast = useToast(s => s.show)
  const url = imageUrl(identity.splash)
  const pos = identity.image_position ?? { x: 50, y: 50 }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const splash = await fileToImageRef(file, 'splash')
      change((c: Champion) => setIdentity(c, { splash, image_position: { x: 50, y: 50 } }))
    } catch (err) {
      toast((err as Error).message || 'That image could not be used.')
    }
  }

  return (
    <div className="tab-body">
      <button className="splash-card" onClick={() => (url ? setActionsOpen(true) : fileRef.current?.click())} aria-label="Splash art">
        {url
          ? <img src={url} alt="" draggable={false} style={{ objectPosition: `${pos.x}% ${pos.y}%` }} />
          : <span className="splash-empty"><ImageIcon size={30} /><span>Add splash art</span></span>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <div>
        <div className="field-label">Lore</div>
        <AutoTextarea
          value={identity.lore ?? ''}
          placeholder="Write the champion's story…"
          maxLength={20000}
          onChange={e => change(c => setIdentity(c, { lore: e.target.value }))}
        />
      </div>

      <SplashActionsSheet
        open={actionsOpen}
        hasImage={!!url}
        onClose={() => setActionsOpen(false)}
        onChoose={() => fileRef.current?.click()}
        onReposition={() => setRepositionOpen(true)}
        onRemove={() => change(c => setIdentity(c, { splash: undefined, image_position: undefined }))}
      />
      <RepositionSheet
        open={repositionOpen}
        image={identity.splash}
        position={pos}
        onCancel={() => setRepositionOpen(false)}
        onDone={p => { setRepositionOpen(false); change(c => setIdentity(c, { image_position: p })) }}
      />
    </div>
  )
}
