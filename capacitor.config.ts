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
    // Nothing here loads a remote page; keep it that way.
    allowMixedContent: false,
  },
}

export default config
