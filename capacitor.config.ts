import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

const config: CapacitorConfig = {
  appId: 'com.conhop30.summonermobile',
  appName: 'Summoner Mobile',
  webDir: 'dist',
  backgroundColor: '#010a13',
  plugins: {
    // The app lifts its own screens by the keyboard's height (see src/platform/keyboard.ts).
    Keyboard: { resize: KeyboardResize.None },
  },
  android: {
    // Android 15 and later draw behind the status and navigation bars; this keeps the page clear of them.
    adjustMarginsForEdgeToEdge: 'auto',
    // Nothing here loads a remote page; keep it that way.
    allowMixedContent: false,
  },
}

export default config
