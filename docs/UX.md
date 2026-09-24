# Summoner Mobile: UX sketch

Status: **draft v2 for review, nothing built.** Summoner Mobile is about the *idea* of a champion: who they are, what they look like, what their abilities are called and what they do. No numbers, no items, no audio. The desktop keeps all of that, and the phone leaves it alone.

The rule for the design: **few screens, short screens, no clutter.** Where something can't be short, it opens in a sheet.

## Ground rules

- Portrait phone first (360-412 dp wide). One dark theme, the desktop's navy, gold and hextech blue. No light mode.
- Touch targets at least 44 dp. Nothing below 12 sp. Autosave everything; there is no Save button.
- Bottom sheets for small pickers, full-screen sheets for the few things that need room (splash repositioning). Android Back closes the top sheet first, then goes up one level.
- Motion is short CSS transitions. No animation library.
- **Navigation is swappable.** The three-way navigation (Story / Identity / Abilities) is one component fed by one list of destinations, with two renderers: a **bottom bar** (the first attempt) and a **hamburger drawer**. Switching is a one-line change, so trying the drawer costs nothing.

## Map

```
Gallery ──tap──▶ Champion ──▶ Present  (chrome-free showcase)
   │                └─ Story · Identity · Abilities
   ├─ + New champion (sheet: name)
   └─ ⋮ Import · Export all · About
```

Two levels deep at most.

## What lives on the phone

| | on the phone |
|---|---|
| Name, title | yes |
| Lore, splash art (framed by drag) | yes |
| Class, lane, attack type, resource, playstyle, tags | yes |
| Each ability (Passive, Q, W, E, R): **icon, name, description** | yes |
| Cooldown, cost, ranks, effects, ratios | no |
| Ability blocks, ability journal | no (kept safe on the desktop, invisible here) |
| Base stats, items, builds | no |
| Theme audio, light/dark, Data Dragon sync, updater | no |
| Poster image, JSON import and export | yes |

Anything the phone doesn't show is preserved untouched when the champion goes back to the desktop (see `contract/SPEC.md`).

## Gallery

```
┌──────────────────────────┐
│ ◈ SUMMONER MOBILE   🔍  ⋮│
├──────────────────────────┤
│ ┌────────┐  ┌────────┐   │
│ │ splash │  │ splash │   │   2-column tiles, same crop as the desktop tile
│ │        │  │        │   │   (the gallery focal point applies)
│ │ Ahri   │  │ Zed    │   │
│ │ Mage   │  │ Assas. │   │
│ └────────┘  └────────┘   │
│                       (+)│   floating New button
└──────────────────────────┘
```

- 🔍 opens an inline name filter, not a screen.
- Long-press a tile: Open · Present · Export this champion · Download poster · Delete (confirms).
- ⋮ menu: Import champions · Export all · About / how transfer works.
- Empty state: one line, one button, plus "Import from Summoner on your computer".

## Champion screen

A sticky header, the content, and the navigation.

```
┌──────────────────────────┐
│ ←  Nyxara           ▶  ⋮ │   name and title are tappable to edit
│    The Hollow Lantern     │   ▶ = Present
├──────────────────────────┤
│                          │
│      (tab content)       │
│                          │
├──────────────────────────┤
│  STORY   IDENTITY  ABILITIES │   bottom bar (first attempt); hides while typing
└──────────────────────────┘
```

Hamburger variant: the bar disappears, ☰ appears at the left of the header and opens a drawer listing Story · Identity · Abilities, with the champion's name and Present at the top.

⋮ menu: Export this champion · Download poster · Delete.

### Story

```
│ ┌──────────────────────┐ │
│ │      splash 16:9     │ │   tap → sheet: Choose image · Reposition · Remove
│ │  [gallery crop frame]│ │
│ └──────────────────────┘ │
│ Lore                     │
│ ┌──────────────────────┐ │
│ │ Once a lantern keeper│ │   grows with the text
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

### Abilities

With the numbers gone this is the simplest screen in the app: five keys, and one ability at a time.

```
│ [P] [Q] [W] [E] [R]      │   key strip; the icon replaces the letter once set
├──────────────────────────┤
│ (icon)  LANTERN BOLT     │   tap the icon: Choose image · Remove
│                          │
│ Describe what it does... │   grows with the text
│                          │
```

It mirrors the desktop's View page: an ability is its icon, name and description. Nothing to scroll past, nothing to configure. The key strip stays put while you type. A filled key shows a small dot so you can see at a glance what's left to write.

## Present (the chrome-free showcase)

Present replaces a separate "preview" screen. It is the champion as a card you can hand to a friend: **no header, no bars, no buttons in sight.**

- **Immersive.** The Android status and navigation bars hide, and the screen stays awake while it's open. The splash is full-bleed behind a soft gradient.
- **Pages, not scrolling chrome.** Swipe sideways through three pages; a few faint dots at the bottom show where you are.
  1. **Cover**: splash, name, title, and the class/lane chips.
  2. **Lore**: the lore, comfortably sized; scrolls if it's long.
  3. **Abilities**: the row of ability icons with name captions; tap one and its description opens beneath it.
- **Getting out.** Tap anywhere to show a thin overlay (✕, Share poster); it fades after a moment. Android Back also exits. Nothing else on screen.
- Landscape works: the cover uses the wider crop.

This is also the natural place for the poster: Share poster in the overlay renders the desktop's poster layout to an image and opens the Android share sheet (Save to Photos, Drive, messaging).

## Import and export

- **Export all / this champion** writes a `concept` file (`contract/SPEC.md`) and opens the share sheet: Save to Files, Drive, email, Nearby Share.
- **Import**: pick a `.json` → the same "here is what will happen" sheet as the desktop: rows for *New / Newer in file / Same / Newer here*, and a Keep mine / Use the file's / Keep both choice for anything that's newer on the phone. Skipped or trimmed items are listed. Nothing is written until you confirm.
- Files from the desktop's **Export for mobile** arrive with splash art and icons embedded. Full backups are accepted too; the desktop-only parts are ignored.
- Later, not in the first slice: tapping a `.json` in Files or an email opens Summoner Mobile straight into the import sheet.

## Being honest about storage

Champions live in the app's own storage on the phone. **Uninstalling the app, or clearing its data, deletes them.** The ⋮ menu shows "last exported: …", and after a good amount of editing without an export there's one quiet reminder. Android's own backup is enabled for the app's data where the system allows it (a bonus, not a promise).

## Left out on purpose

Everything in the "no" column above, plus Advanced ability mode (roadmap) and the updater screen (the APK is updated by installing the new one; the app can later say "a newer version exists" and link to it).

## Open decisions

1. **Ability blocks and the ability journal.** I've left both off the phone: blocks are a numbers-and-structure feature, and the journal is a design-notes tool the View page doesn't show. They survive untouched on the desktop. Easy to add later without changing the file format. Say if you want either back.
2. **Present pages.** Swipe sideways through Cover / Lore / Abilities (above), or one long scrolling page? I'd go with swipe: it's the "no clutter" version.
3. **Poster.** Keep it as a share action from Present and the ⋮ menu (above), or drop it from the first slice?
