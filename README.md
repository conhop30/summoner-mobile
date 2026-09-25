# Summoner Mobile

A compact Android companion to [Summoner](https://github.com/conhop30/summoner): design a champion's concept (story, identity, abilities and their parts, plus notes) on your phone, and move champions to and from the desktop app as JSON.

It is about the *idea* of a champion. Numbers, items and builds stay in Summoner on your computer, and importing on either side updates what it recognises and never overwrites the other side's data.

Status: first slice built and verified on an Android emulator. Not released yet.

## What is in it

- **Gallery** of champions with search, long-press actions, create, and import/export.
- **Story**: splash art (with a drag-to-frame view showing what the gallery tile keeps) and lore.
- **Identity**: class, lane, attack type, resource, playstyle, tags.
- **Abilities**: Passive, Q, W, E, R, each with an icon, name and description, plus **parts** (extra passives, alternate forms like Gnar's and Jayce's, recasts).
- **Journal**: per-ability notes, from the floating hex widget (a menu that will grow).
- **Present**: a full-screen, chrome-free showcase you swipe through (Cover, Lore, Abilities).
- **Import / export** of the format in `contract/SPEC.md`, through the Android share sheet and file picker.

Design notes are in `docs/UX.md`.

## The contract with the desktop app

`contract/` and `src/interchange/` are copied byte for byte from Summoner's repo and are the only thing the two apps share. Run `node contract/hash.mjs` here and in Summoner: the two must print the same value. `src/interchange/contract.test.ts` runs the shared fixtures, so a format change that hasn't reached both repos fails a test. Don't edit those folders here; change them in Summoner and copy them across.

## Working on it

```
npm install
npm run dev            # the web build in a browser (use the browser's phone view)
npm test               # unit tests: model, storage, import/export, image helpers, contract fixtures
npm run build          # typecheck + production build into dist/
```

### Android

The app is a Capacitor shell around the web build. You need JDK 21 and the Android SDK (`ANDROID_HOME`). Gradle 8 does not run on JDK 25, so if your `JAVA_HOME` points at a newer JDK (Android Studio's bundled one may), point it at 21 for the build:

```
npm run android:sync                               # build the web app and copy it into android/
cd android
JAVA_HOME="<path to JDK 21>" ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`android/app/src/main/java/.../ImmersivePlugin.java` is the one piece of native code: it hides the system bars and keeps the screen awake during Present.

## Where champions are stored

In the app's own storage on the phone (IndexedDB). Uninstalling the app or clearing its data deletes them, so the app shows when you last exported and nudges you to export after heavy editing.
