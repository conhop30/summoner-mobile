import Sheet from '../ui/Sheet'
import { APP_VERSION } from '../logic/transfer'
import { isNative } from '../platform'
import { detectPlatform, promptInstall, usePwa } from '../platform/pwa'
import { useLibrary } from '../store/library'
import { useSettings } from '../store/settings'

function when(iso: string | null) {
  if (!iso) return 'never'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'never' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lastExportedAt = useLibrary(s => s.lastExportedAt)
  const navStyle = useSettings(s => s.navStyle)
  const set = useSettings(s => s.set)
  const { canInstall, installed, persisted } = usePwa()
  const ios = detectPlatform() === 'ios'

  return (
    <Sheet open={open} onClose={onClose} title="About">
      <p className="sheet-message">
        Summoner Mobile is for the idea of a champion: story, identity, and what each ability is called and does.
        Numbers, items and builds stay in Summoner on your computer.
      </p>

      <div>
        <div className="field-label">Moving champions to and from your computer</div>
        <p className="sheet-message">
          Export writes a file you can save to Drive, email or send with Nearby Share. In Summoner on your computer,
          use Settings → Data → Import. Going the other way, use Export for mobile there and Import here. Importing
          updates champions it recognises and never touches your computer's stats, builds or ability numbers.
        </p>
      </div>

      <div>
        <div className="field-label">Your data</div>
        <p className="sheet-message">
          Champions are stored on this device only, never sent anywhere. Uninstalling the app or clearing its site data
          deletes them, so export now and then. Last exported: {when(lastExportedAt)}.
          {persisted === false && ' Your browser has not promised to keep this data if space runs low, so exporting matters more.'}
        </p>
      </div>

      {!isNative() && !installed && (
        <div>
          <div className="field-label">Install</div>
          <p className="sheet-message">
            Installing puts Summoner on your home screen and lets it open with no connection.
            {!canInstall && (ios
              ? ' In Safari, tap Share, then Add to Home Screen.'
              : ' Use your browser\'s menu, then Install app or Add to Home screen.')}
          </p>
          {canInstall && <button className="btn primary" onClick={() => void promptInstall()}>Install app</button>}
        </div>
      )}

      <div>
        <div className="field-label">Experimental: navigation</div>
        <div className="chips">
          <button className={`chip${navStyle === 'bottom' ? ' on' : ''}`} onClick={() => set({ navStyle: 'bottom' })}>Bottom bar</button>
          <button className={`chip${navStyle === 'drawer' ? ' on' : ''}`} onClick={() => set({ navStyle: 'drawer' })}>Hamburger menu</button>
        </div>
      </div>

      <p className="muted">Version {APP_VERSION}</p>
    </Sheet>
  )
}
