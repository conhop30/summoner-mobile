# Summoner Mobile

A compact phone companion to [Summoner](https://github.com/conhop30/summoner): design a champion's concept (story, identity, abilities and their parts, plus notes) on your phone, and move champions to and from the desktop app as JSON.

It is about the *idea* of a champion. Numbers, items and builds stay in Summoner on your computer, and importing on either side updates what it recognises and never overwrites the other side's data.

There is no account, no server and no store listing. Champions live on your device, the app makes no network requests of its own, and it works with no connection.

Status: first slice built and verified on an Android emulator (install, update in place, Back, keyboard, immersive Present, share sheet, photo picker).

## Get it

**Android app (recommended):** [download SummonerMobile.apk](https://github.com/conhop30/summoner-mobile/releases/latest/download/SummonerMobile.apk) and open it. Android will ask you to allow installing from your browser or Files app, and Play Protect may warn that the app is from an unknown developer; both are expected for an app that isn't in the Play Store. The link always points at the newest release, and installing a newer one over an older one keeps your champions.

**Or use it as a web app:** open **https://conhop30.github.io/summoner-mobile/** in Chrome and choose **⋮ → Install app**, or in Safari on iPhone **Share → Add to Home Screen**. It works offline once opened, and new versions take over on the next launch. The Android app and the web app store champions separately; move champions between them, or to the desktop, with export and import.

### About the signing key

Android only installs signed apps and only lets an update replace an app signed with the *same* key. To keep every release an upgrade of the last without anyone guarding a secret, this project signs with one fixed **public** key (`android/public-signing.keystore`, password `android`). It is an identity for updates, not a secret: anyone can build an app signed with it, so install Summoner Mobile only from this repository's releases. Nothing else about the app depends on it.

## What is in it

- **Gallery** of champions with search, long-press actions, create, and import/export.
- **Story**: splash art (with a drag-to-frame view showing what the gallery tile keeps) and lore.
- **Identity**: class, lane, attack type, resource, playstyle, tags.
- **Abilities**: Passive, Q, W, E, R, each with an icon, name and description, plus **parts** (extra passives, alternate forms like Gnar's and Jayce's, recasts).
- **Journal**: per-ability notes, from the floating hex widget (a menu that will grow).
- **Present**: a full-screen, chrome-free showcase you swipe through (Cover, Lore, Abilities).
- **Import / export** of the format in `contract/SPEC.md`, through the Android share sheet and file picker. (In a browser, Chrome on Android refuses to share `.json` files, so the web app saves the file to Downloads instead.)

Design notes are in `docs/UX.md`.

## The contract with the desktop app

`contract/` and `src/interchange/` are copied byte for byte from Summoner's repo and are the only thing the two apps share. Run `node contract/hash.mjs` here and in Summoner: the two must print the same value. `src/interchange/contract.test.ts` runs the shared fixtures, so a format change that hasn't reached both repos fails a test. Don't edit those folders here; change them in Summoner and copy them across.

## Working on it

```
npm install
npm run dev            # the web build in a browser (use the browser's phone view)
npm test               # unit tests: model, storage, import/export, back-button history, image helpers, contract fixtures
npm run build          # typecheck + production build into dist/ (includes the offline worker)
npm run preview        # serve the production build; the offline worker only runs on this, not in dev
```

To try the web app on a phone or emulator, serve the build and reach it as `localhost` (a secure context, which installing and the offline worker require): `npm run preview -- --host 127.0.0.1`, then `adb reverse tcp:4173 tcp:4173` and open `http://localhost:4173` in Chrome on the device.

### Building the Android app

The app is a Capacitor shell around the web build. You need JDK 21 and the Android SDK (`ANDROID_HOME`). Gradle 8 does not run on JDK 25, so if your `JAVA_HOME` points at a newer JDK (Android Studio's bundled one may), point it at 21 for the build:

```
npm run android:sync                               # build the web app and copy it into android/
cd android
JAVA_HOME="<path to JDK 21>" ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
adb install -r app/build/outputs/apk/release/app-release.apk
```

`android/app/src/main/java/.../ImmersivePlugin.java` is the one piece of native code: it hides the system bars and keeps the screen awake during Present.

### Releasing

Bump `version` in `package.json`, commit, then tag and push:

```
git tag v0.1.1 && git push origin v0.1.1
```

`.github/workflows/release.yml` runs the tests, builds the signed APK, and attaches it to a GitHub release as `SummonerMobile.apk` (the tag must match `package.json`). The Android version code is derived from the version (`major*10000 + minor*100 + patch`), so it rises with every release. The same workflow can be run by hand from the Actions tab to build an APK without publishing.

`.github/workflows/pages.yml` publishes the web app to GitHub Pages on every push to `main`, after the tests pass. Neither workflow needs a secret.

### What is browser-specific

`src/platform/` holds everything that differs between the Android app and the web app:

- **Back button.** The Android app gets the hardware Back event. The web app has only browser history, so `webHistory.ts` gives each open sheet or menu a history entry, and Back closes it before leaving the screen.
- **Keyboard.** The app measures how much of the page the keyboard covers and lifts sheets above it (`keyboard.ts`).
- **Present.** The Android app hides the system bars natively; the web app uses the browser's fullscreen and wake lock. Leaving fullscreen leaves Present.
- **Share.** The Android app opens the system share sheet; the web app tries the browser's and falls back to a download.

## Where champions are stored

On your device, in the app's own storage (IndexedDB). Uninstalling the app or clearing its data deletes them, so the app shows when you last exported and nudges you to export after heavy editing.
