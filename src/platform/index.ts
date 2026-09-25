// The few things that go through the browser rather than the page itself: sharing a file and
// Present's fullscreen. (The back button and the keyboard have their own files here.)

// ─── Sharing a JSON file ─────────────────────────────────────────────────────

// 'saved' means the file went to the device's Downloads folder instead of a share sheet.
export type ShareResult = 'shared' | 'saved' | 'cancelled'

// Opens the phone's share sheet (Save to Files, Drive, email, Nearby Share...). Where the browser
// won't share the file (desktop browsers, and Chrome on Android, which refuses .json), it
// downloads it instead.
export async function shareJsonFile(fileName: string, json: string): Promise<ShareResult> {
  const file = new File([json], fileName, { type: 'application/json' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (err) {
      // Closing the share sheet without choosing anything rejects with an AbortError.
      if ((err as Error)?.name === 'AbortError') return 'cancelled'
      // Anything else (permission, no target app): fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'saved'
}

// ─── Present: fullscreen and a screen that stays on ──────────────────────────

let wakeLock: WakeLockSentinel | null = null
let immersive = false

async function holdScreenAwake() {
  try { wakeLock = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* denied, or unsupported */ }
}

// A wake lock is dropped when the page is hidden; take it again when the user comes back.
document.addEventListener('visibilitychange', () => {
  if (immersive && document.visibilityState === 'visible') void holdScreenAwake()
})

export async function enterImmersive(): Promise<void> {
  immersive = true
  try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }) } catch { /* not allowed here (iPhone): Present still works */ }
  await holdScreenAwake()
}

// The browser can end fullscreen itself (Back, or the edge-swipe gesture) without telling the
// page's history. The caller gets to treat that as "the user left".
export function onImmersiveExit(handler: () => void): () => void {
  const listener = () => { if (immersive && !document.fullscreenElement) handler() }
  document.addEventListener('fullscreenchange', listener)
  return () => document.removeEventListener('fullscreenchange', listener)
}

export async function exitImmersive(): Promise<void> {
  immersive = false
  try { if (document.fullscreenElement) await document.exitFullscreen() } catch { /* already out */ }
  try { await wakeLock?.release() } catch { /* already released */ }
  wakeLock = null
}
