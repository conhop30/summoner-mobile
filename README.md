# Summoner Mobile

A compact phone companion to [Summoner](https://github.com/conhop30/summoner): design a champion's concept (story, identity, abilities and their parts, plus notes) on your phone, and move champions to and from the desktop app as JSON.

It is about the *idea* of a champion. Numbers, items and builds stay in Summoner on your computer, and importing on either side updates what it recognises and never overwrites the other side's data.

It is a web app you install from its page, like any installed web app. There is no account, no server, and no store listing: champions live on your device, the app makes no network requests of its own, and once installed it opens with no connection.

Status: first slice built and verified in Chrome on an Android emulator (install, offline, Back, keyboard, fullscreen Present, export, photo picker).

## Installing

Open the app's page in Chrome on Android and choose **⋮ → Install app** (or **Add to Home screen**). On iPhone, open it in Safari and choose **Share → Add to Home Screen**. The About sheet in the app repeats this and offers a one-tap install button where the browser allows it.

Updates arrive by themselves: the app checks its own page when you open it, and the new version takes over the next time you launch it, never in the middle of an edit. Your champions are not touched by an update.

## What is in it

- **Gallery** of champions with search, long-press actions, create, and import/export.
- **Story**: splash art (with a drag-to-frame view showing what the gallery tile keeps) and lore.
- **Identity**: class, lane, attack type, resource, playstyle, tags.
- **Abilities**: Passive, Q, W, E, R, each with an icon, name and description, plus **parts** (extra passives, alternate forms like Gnar's and Jayce's, recasts).
- **Journal**: per-ability notes, from the floating hex widget (a menu that will grow).
- **Present**: a full-screen, chrome-free showcase you swipe through (Cover, Lore, Abilities).
- **Import / export** of the format in `contract/SPEC.md`. Export opens the share sheet where the browser allows it; Chrome on Android refuses to share `.json` files, so there it saves the file to Downloads and you share it from Files or Drive.

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

To try it on a phone or emulator, serve the build and reach it as `localhost` (a secure context, which installing and the offline worker require): `npm run preview -- --host 127.0.0.1`, then `adb reverse tcp:4173 tcp:4173` and open `http://localhost:4173` in Chrome on the device.

### Publishing

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages on every push to `main`, after the tests pass. It needs no secrets or keys; enable Pages for the repository (Settings → Pages → Source: GitHub Actions). The app uses relative paths and a hash router, so it works from the repository's subfolder URL.

### What is browser-specific

`src/platform/` holds everything that differs by environment:

- **Back button.** Installed web apps have no back-button event, only browser history. `webHistory.ts` gives each open sheet or menu a history entry, so Back closes it before leaving the screen.
- **Keyboard.** The keyboard covers the page rather than resizing it; `keyboard.ts` measures the covered part and lifts sheets above it.
- **Present.** Uses the browser's fullscreen and screen wake lock; leaving fullscreen leaves Present.
- **Storage.** IndexedDB, and the app asks the browser to keep it (`navigator.storage.persist`).

## Where champions are stored

On your device, in the browser's storage for this app (IndexedDB). Uninstalling the app or clearing its site data deletes them, so the app shows when you last exported and nudges you to export after heavy editing. The About sheet says so if the browser has not agreed to keep the data when space runs low.
