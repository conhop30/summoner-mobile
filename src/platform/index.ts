// Everything that differs between the Android app and a plain browser (used for development and
// tests): sharing a file, the back button, the status bar, and immersive mode.

import { registerPlugin, Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNative = (): boolean => Capacitor.isNativePlatform()

// ─── Sharing a JSON file ─────────────────────────────────────────────────────

export type ShareResult = 'shared' | 'cancelled'

// On the phone: writes the file to the app's cache and opens the share sheet (Save to Files, Drive,
// email, Nearby Share...). In a browser: downloads it.
export async function shareJsonFile(fileName: string, json: string): Promise<ShareResult> {
  if (!isNative()) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return 'shared'
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
export async function enterImmersive(): Promise<void> {
  if (!isNative()) return
  try { await Immersive.enter() } catch { /* plugin missing: Present still works, with the bars showing */ }
}

export async function exitImmersive(): Promise<void> {
  if (!isNative()) return
  try { await Immersive.exit() } catch { /* see above */ }
}

// ─── Back button ─────────────────────────────────────────────────────────────

export function onHardwareBack(handler: () => void): () => void {
  if (!isNative()) return () => {}
  const registered = App.addListener('backButton', handler)
  return () => { void registered.then(h => h.remove()) }
}

export function exitApp(): void {
  if (isNative()) void App.exitApp()
}
