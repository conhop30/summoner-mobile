// What makes the web build an installable app: the offline worker, the install prompt, and asking
// the browser to keep the saved champions instead of clearing them when the device runs low on space.

import { create } from 'zustand'

// Chrome's install prompt, held until the user asks for it from the About sheet.
interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
let deferred: InstallPrompt | null = null

export type Platform = 'android-like' | 'ios' | 'other'

export const usePwa = create<{
  canInstall: boolean       // the browser offers a one-tap install
  installed: boolean        // running as an installed app
  persisted: boolean | null // the browser agreed to keep the data; null = not asked or unsupported
}>(() => ({ canInstall: false, installed: false, persisted: null }))

export const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export function detectPlatform(ua = navigator.userAgent): Platform {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android-like'
  return 'other'
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return
  const prompt = deferred
  deferred = null
  usePwa.setState({ canInstall: false })
  await prompt.prompt()
  await prompt.userChoice
}

export function initPwa(): void {
  usePwa.setState({ installed: isStandalone() })

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferred = e as InstallPrompt
    usePwa.setState({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    usePwa.setState({ canInstall: false, installed: true })
  })

  // Ask to keep the data. Installed apps are usually granted this without a prompt.
  void navigator.storage?.persist?.().then(
    granted => usePwa.setState({ persisted: granted }),
    () => {},
  )

  // Offline: the worker keeps the app itself on the device. Development builds skip it.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('./sw.js').catch(() => { /* the app works without it */ })
    })
  }
}
