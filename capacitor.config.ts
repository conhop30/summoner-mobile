import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.conhop30.summonermobile',
  appName: 'Summoner Mobile',
  webDir: 'dist',
  backgroundColor: '#010a13',
  android: {
    // Nothing here loads a remote page; keep it that way.
    allowMixedContent: false,
  },
}

export default config
