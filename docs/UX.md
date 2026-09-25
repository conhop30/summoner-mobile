# Summoner Mobile: UX

Status: **v3, first slice built. Ships as an Android app (signed APK on GitHub releases) and as an installable web app; see the README.** Summoner Mobile is about the *idea* of a champion: who they are, what they look like, what their abilities are called and what they do, including the multi-part abilities (Gnar, Jayce). No numbers, no items, no audio. The desktop keeps all of that, and the phone leaves it alone.

The rule for the design: **few screens, short screens, no clutter.** Where something can't be short, it opens in a sheet.

## Ground rules

- Portrait phone first (360-412 dp wide). One dark theme, the desktop's navy, gold and hextech blue. No light mode.
- Touch targets at least 44 dp. Nothing below 12 sp. Autosave everything; there is no Save button.
- Bottom sheets for small pickers, full-screen sheets for the few things that need room (splash repositioning, journal). Android Back closes the top sheet first, then goes up one level.
- Motion is short CSS transitions. No animation library.
- **Navigation is swappable.** Story / Identity / Abilities is one component fed by one list of destinations, with two renderers: a **bottom bar** (first attempt) and a **hamburger drawer**. Switching is a one-line change.

## Map

```
Gallery ──tap──▶ Champion ──▶ Present  (chrome-free showcase)
   │                └─ Story · Identity · Abilities      + floating widget (Journal, ...)
   ├─ + New champion (sheet: name)
   └─ ⋮ Import · Export all · About
```

## What lives on the phone

| | on the phone |
|---|---|
| Name, title, lore, splash art (framed by drag) | yes |
| Class, lane, attack type, resource, playstyle, tags | yes |
| Each ability (Passive, Q, W, E, R): **icon, name, description** | yes |
| **Parts** of an ability (extra passive, alternate form, recast): kind, name, description, recast condition | yes |
| **Ability journal** notes | yes, via the floating widget |
| Cooldown, cost, ranks, effects, ratios, part numbers | no |
| Base stats, items, builds | no |
| Theme audio, light/dark, Data Dragon sync, updater | no |
| JSON import and export | yes |
| Poster image | not in the first slice |

Anything the phone doesn't show is preserved untouched when the champion goes back to the desktop (see `contract/SPEC.md`).

## Gallery

```
┌──────────────────────────┐
│ ◈ SUMMONER MOBILE   🔍  ⋮│
├──────────────────────────┤
│ ┌────────┐  ┌────────┐   │
│ │ splash │  │ splash │   │   2-column tiles, same crop as the desktop tile
│ │ Ahri   │  │ Zed    │   │
│ │ Mage   │  │ Assas. │   │
│ └────────┘  └────────┘   │
│                       (+)│   floating New button
└──────────────────────────┘
```

- 🔍 opens an inline name filter, not a screen.
- Long-press a tile: Open · Present · Export this champion · Delete (confirms).
- ⋮ menu: Import champions · Export all · About / how transfer works.
- Empty state: one line, one button, plus "Import from Summoner on your computer".

## Champion screen

```
┌──────────────────────────┐
│ ←  Nyxara               ▶│   name and title tappable to edit; ▶ = Present
│    The Hollow Lantern     │
├──────────────────────────┤
│                          │
│      (tab content)    ◈  │   ◈ = the floating widget
│                          │
├──────────────────────────┤
│  STORY   IDENTITY  ABILITIES │   bottom bar (first attempt); hides while typing
└──────────────────────────┘
```

Hamburger variant: the bar disappears and ☰ appears at the left of the header, opening a drawer with Story · Identity · Abilities and Present.

### The floating widget

A small gold hex button that floats over the champion screen. It is a menu that stays out of the way until wanted:

- Sits at the screen edge, semi-transparent when idle; **drag it up or down** and it snaps back to the edge and remembers where you left it. It never covers the keyboard's input line.
- Tap: a compact menu pops out beside it. **Today it has one entry, Journal.** It is deliberately a menu, not a Journal button, so that other features can move in over time (Present, export this champion, the navigation itself in hamburger mode).
- **Journal** opens a full-screen sheet: a key selector across the top (P Q W E R, starting on the ability you were just looking at), note tabs under it (add, rename, delete), and a large auto-growing text area. Same model as the desktop: notes belong to an ability.
- It is hidden in Present mode and in the Gallery for now.

### Story

```
│ ┌──────────────────────┐ │
│ │      splash 16:9     │ │   tap → sheet: Choose image · Reposition · Remove
│ │  [gallery crop frame]│ │
│ └──────────────────────┘ │
│ Lore                     │
│ ┌──────────────────────┐ │   grows with the text
│ │ Once a lantern keeper│ │
│ └──────────────────────┘ │
```

**Reposition** goes full screen: drag the image, the gold gallery-crop frame shows what the tile keeps, Done / Cancel at the top. The "?" tip (ideal image 16:9, about 2880 × 1620) is on the Choose sheet. Images are shrunk when picked (long side 1920).

### Identity

Chips in labelled groups, all multi-select; nothing here needs a sheet.

```
│ CLASS    [Assassin][Fighter][Mage]...    │
│ LANE     [Top][Jungle][Mid][Bot][Support]│
│ ATTACK   [Melee][Ranged]                 │
│ RESOURCE [Mana][Energy][Fury][Heat][None]│
│ PLAYSTYLE [Burst][Poke]... [+ custom]    │
│ TAGS     fox · mage · [+ add]            │
```

### Abilities (with parts)

Five keys across the top, one ability at a time. **Parts** are the multi-ability system from the desktop: an extra passive, an alternate form (Gnar's Mega spells, Jayce's cannon and hammer) or a recast (Akali's). A key with parts shows a second, smaller chip row beneath the key strip, so a whole multi-form ability is one tab and a couple of taps.

```
│ [P] [Q] [W] [E] [R]      │   key strip; the icon replaces the letter once set
│ Main · Mega Bolt · Recall · ＋   │   parts row: only what this key has, plus "add part"
├──────────────────────────┤
│ (icon) LANTERN BOLT      │   Main: icon, name, description
│ Describe what it does... │
```

Selecting a part swaps the editor to that part:

```
│ Main · [Mega Bolt] · Recall · ＋ │
│ [Passive] [Alternate form] [Recast]   │   kind chips
│ NAME   Mega Bolt         │
│ Bigger, slower...        │   description
│ WHEN   after Q hits...   │   recast only: the unlock condition
│              Remove this part │
```

- The icon belongs to the key (as on the desktop), so it's edited on Main.
- A part added on the phone has no numbers yet; the desktop fills those in.
- A key that has content shows a small dot on the strip, so what's left to write is visible at a glance.

## Present (chrome-free showcase)

The champion as a card you can hand to a friend: **no header, no bars, no buttons in sight.**

- **Immersive.** The Android status and navigation bars hide and the screen stays awake. The splash is full-bleed behind a soft gradient.
- **Swipe left and right** between three pages. **A page indicator at the bottom** shows where you are: three dots (the current one stretched and gold) and the page's name in small capitals above them (COVER, LORE, ABILITIES).
  1. **Cover**: splash, name, title, class/lane chips.
  2. **Lore**: the lore, comfortably sized; scrolls if it's long.
  3. **Abilities**: the row of ability icons with name captions; tap one and its description opens beneath it. A key with parts shows small chips (Main, Mega Bolt, ...) to flip between them.
- **Getting out.** Tap anywhere to show a thin overlay with a ✕; it fades after a moment. Android Back also exits.
- Landscape works: the cover uses the wider crop.

## Import and export

- **Export all / this champion** writes a `concept` file (`contract/SPEC.md`) and opens the share sheet: Save to Files, Drive, email, Nearby Share.
- **Import**: pick a `.json` → the same "here is what will happen" sheet as the desktop: rows for *New / Newer in file / Same / Newer here*, and a Keep mine / Use the file's / Keep both choice for anything newer on the phone. Skipped or trimmed items are listed. Nothing is written until you confirm.
- Files from the desktop's **Export for mobile** arrive with splash art and icons embedded. Full backups are accepted too; the desktop-only parts are ignored.
- Later: tapping a `.json` in Files or an email opens Summoner Mobile straight into the import sheet.

## Being honest about storage

Champions live in the app's own storage on the phone. **Uninstalling the app, or clearing its data, deletes them.** The ⋮ menu shows "last exported: ...", and after a good amount of editing without an export there's one quiet reminder. Android's own backup is enabled for the app's data where the system allows it (a bonus, not a promise).

## Left out on purpose

Everything in the "no" rows above, the poster image (later), Advanced ability mode (roadmap), and an updater screen (the APK is updated by installing the new one; the app can later say "a newer version exists").

## Build plan

1. **Slice 1:** scaffold; storage; gallery and create; Story; Identity; Abilities with parts; the floating widget with Journal; Present; import and export; a debug APK verified on the emulator.
2. **Slice 2:** polish from real use; poster; open-with-a-`.json`; the hamburger variant of the navigation.
3. **Ship:** signing key, GitHub release, the QR code and the portfolio page.
