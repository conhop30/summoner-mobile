// Everything that differs between the Android shell and the web app (an installed PWA, or a plain
// browser tab): sharing a file, the back button, the status bar, and immersive mode.

import { registerPlugin, Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNative = (): boolean => Capacitor.isNativePlatform()

// ─── Sharing a JSON file ─────────────────────────────────────────────────────

// 'saved' means the file went to the device's Downloads folder instead of a share sheet.
export type ShareResult = 'shared' | 'saved' | 'cancelled'

// On the phone: opens the share sheet (Save to Files, Drive, email, Nearby Share...). Where the
// browser won't share the file (desktop browsers, and Chrome on Android, which refuses .json), it
// downloads it instead.
export async function shareJsonFile(fileName: string, json: string): Promise<ShareResult> {
  if (!isNative()) {
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
  const written = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 })
  try {
    await Share.share({ title: fileName, files: [written.uri], dialogTitle: 'Export champions' })
    return 'shared'
  } catch (err) {
    // Closing the share sheet without choosing anything rejects; that isn't an error.
    if (/cancel/i.test(String((err as Error)?.message))) return 'cancelled'
    throw err
  }
}

// ─── System chrome ───────────────────────────────────────────────────────────

export async function setupSystemChrome(): Promise<void> {
  if (!isNative()) return
  try {
    // Light icons on the dark app, and the app's own colour behind the bar.
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#010a13' })
  } catch { /* an older WebView may lack this; the app still works */ }
}

interface ImmersivePlugin {
  enter: () => Promise<void>
  exit: () => Promise<void>
}
const Immersive = registerPlugin<ImmersivePlugin>('Immersive')

// Present mode: hides the status and navigation bars and keeps the screen awake.
let wakeLock: WakeLockSentinel | null = null
let immersive = false

async function holdScreenAwake() {
  try { wakeLock = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* denied, or unsupported */ }
}

// A wake lock is dropped when the page is hidden; take it again when the user comes back.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (immersive && document.visibilityState === 'visible') void holdScreenAwake()
  })
}

export async function enterImmersive(): Promise<void> {
  if (isNative()) {
    try { await Immersive.enter() } catch { /* plugin missing: Present still works, with the bars showing */ }
    return
  }
  immersive = true
  try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }) } catch { /* not allowed here (iPhone): Present still works */ }
  await holdScreenAwake()
}

// Web only: the browser can end fullscreen itself (Back, or the edge-swipe gesture) without telling
// the page's history. The caller gets to treat that as "the user left".
export function onImmersiveExit(handler: () => void): () => void {
  if (isNative()) return () => {}
  const listener = () => { if (immersive && !document.fullscreenElement) handler() }
  document.addEventListener('fullscreenchange', listener)
  return () => document.removeEventListener('fullscreenchange', listener)
}

export async function exitImmersive(): Promise<void> {
  if (isNative()) {
    try { await Immersive.exit() } catch { /* see above */ }
    return
  }
  immersive = false
  try { if (document.fullscreenElement) await document.exitFullscreen() } catch { /* already out */ }
  try { await wakeLock?.release() } catch { /* already released */ }
  wakeLock = null
}

// ─── Back button ─────────────────────────────────────────────────────────────

// Native only. In the web app, Back is browser history (see webHistory.ts).
export function onHardwareBack(handler: () => void): () => void {
  if (!isNative()) return () => {}
  const registered = App.addListener('backButton', handler)
  return () => { void registered.then(h => h.remove()) }
}

export function exitApp(): void {
  if (isNative()) void App.exitApp()
}
