# Summoner Mobile: UX sketch

Status: **draft for review, nothing built.** The point of the app is a champion *concept*: story, identity, abilities. No numbers to balance, no items, no audio. The design problem is fitting a real-estate-hungry editor onto a phone without it feeling cramped, so the rule is: **the main screens stay short, and anything long opens in a sheet.**

## Ground rules

- Portrait phone first (360–412 dp wide). Landscape just works; it isn't designed for.
- One dark theme, the desktop's navy, gold and hextech blue. No light mode.
- Touch targets at least 44 dp. Nothing below 12 sp. Numeric fields open the number keyboard.
- **Bottom sheets** for anything that edits a list or a long form; **full-screen sheets** for the few that need the room (splash repositioning, journal, block editor). Android Back closes the top sheet first, then goes up one screen.
- Autosave everything. No Save button, ever (same as desktop).
- Motion is short CSS transitions (sheet slides, fades). No animation library.

## Map

```
Gallery ──tap──▶ Champion ──eye──▶ Preview (showcase)
   │                │                  └─ Download poster · Export JSON
   │                └─ Story · Identity · Abilities   (bottom bar)
   ├─ + New champion (sheet: name)
   └─ ⋮ Import · Export all · About
```

Two levels deep at most. Preview is a full-screen view you leave with Back.

## Gallery

```
┌──────────────────────────┐
│ ◈ SUMMONER MOBILE   🔍  ⋮│
├──────────────────────────┤
│ ┌────────┐  ┌────────┐   │
│ │ splash │  │ splash │   │   2-column tiles, same crop as desktop
│ │        │  │        │   │   (the gallery focal point applies)
│ │ Ahri  ◔│  │ Zed   ◔│   │   ◔ = how complete the champion is
│ │ Mage   │  │ Assas. │   │
│ └────────┘  └────────┘   │
│ ┌────────┐  ┌────────┐   │
│ │  ...   │  │  ...   │   │
│                       (+)│   floating New button, bottom right
└──────────────────────────┘
```

- **Search** (🔍) filters by name; it opens as an inline field, not a screen.
- **Long-press a tile** → sheet: Open · Preview · Export this champion · Download poster · Delete (confirms).
- **⋮ menu**: Import champions · Export all · About / how transfer works.
- Empty state: one line, one button, plus "Import from Summoner on your computer".

## Champion screen

A sticky header that never scrolls away, a content area, and a bottom bar.

```
┌──────────────────────────┐
│ ←  Nyxara            👁  ⋮│   name is tappable to edit; 👁 = Preview
│    The Hollow Lantern     │   title is tappable too
├──────────────────────────┤
│                          │
│      (tab content)       │
│                          │
├──────────────────────────┤
│  STORY   IDENTITY  ABILITIES │   bottom bar: thumb reach
└──────────────────────────┘
```

- Name and Title sit in the header on every tab, as on desktop.
- ⋮ menu: Export this champion · Download poster · Delete.

### Story tab

```
│ ┌──────────────────────┐ │
│ │      splash 16:9     │ │   tap → sheet: Choose image · Reposition · Remove
│ │  [gallery crop frame]│ │
│ └──────────────────────┘ │
│ Lore                     │
│ ┌──────────────────────┐ │
│ │ Once a lantern keeper│ │   grows with the text; no inner scrolling
│ │ ...                  │ │
│ └──────────────────────┘ │
```

**Reposition** opens full screen: the image fills the screen, drag to move, the gold gallery-crop frame shows what the tile keeps, **Done** / **Cancel** at the top. The small "?" tip about the ideal image (16:9, about 2880 × 1620) lives on the Choose sheet. Images are shrunk when picked (long side 1920) so storage and exports stay small.

### Identity tab

Chips in labelled groups, all multi-select, each group one tight block:

```
│ CLASS    [Assassin][Fighter][Mage]...    │
│ LANE     [Top][Jungle][Mid][Bot][Support]│
│ ATTACK   [Melee][Ranged]                 │
│ RESOURCE [Mana][Energy][Fury][Heat][None]│
│ PLAYSTYLE [Burst][Poke]... [+ custom]    │
│ TAGS     fox · mage · [+ add]            │
```

Nothing in a sheet here; it is already compact.

### Abilities tab: the one that needs care

The five keys are a sticky strip; everything under it is the selected ability. The long parts collapse into **summary rows** that open sheets.

```
│ [P] [Q] [W] [E] [R]      │   key strip (icon once set, letter before)
├──────────────────────────┤
│ (icon) LANTERN BOLT   ranks − 5 + │
│ Describe what it does... │   description, grows with text
├──────────────────────────┤
│ Cooldown   8 · 7.5 · 7 · 6.5 · 6 ›│   tap a row → its sheet
│ Cost       50 · 55 · 60 · 65 · 70 ›│   (Mana)
│ Effects    Damage · Magic · 60…  ›│   2
│ Blocks     Empowered Bolt, Recast ›│   2
│ Journal    3 notes               ›│
```

- **Cooldown / Cost sheet**: one input per rank across the width (5–6 fit at 44 dp), Next moves rank to rank, the same "suggest +N per rank" chip as desktop, cost type picker for Cost.
- **Effects sheet**: a list of effect cards; each card has type, damage type, a per-rank base row, and ratio rows (stat picker plus per-rank row). Add/remove inline.
- **Blocks sheet** (full screen): a list; each block picks a kind (passive, alternate form, recast) and edits the same fields as an ability, in the same sheet style. Recast blocks add max recasts, window, and the unlock condition.
- **Journal sheet** (full screen): note tabs across the top, a big text area, add/rename/delete. Keyed to the selected ability, like desktop.
- **Ability icon**: tap the icon → Choose image / Remove. Shrunk to 256 px when picked.
- **Ranks**: the − / + stepper changes the rank count (1–6) and reshapes every per-rank list, as on desktop.

Why summary rows: the desktop shows every field at once, which is about four screens of scrolling on a phone. Rows keep the tab to roughly one screen and make the ability's shape scannable, at the cost of one tap to edit numbers.

### Preview (showcase)

Full screen, read-only: splash with a gradient, name and title, class/lane chips, lore (collapses to a few lines with "Read more"), then a **row of ability icons with name captions**; tapping one shows its spotlight card below (description, cooldown, cost, effects by rank as compact rows). Header actions: **Download poster**, **Export JSON**.

The poster is the desktop's poster, redrawn to the same layout and shared through the Android share sheet (Save to Photos, Drive, messaging, and so on).

## Import and export

- **Export all / this champion**: writes a `concept` file (the contract in `contract/SPEC.md`) and opens the share sheet: Save to Files, Drive, email, Nearby Share, and so on.
- **Import**: pick a `.json` → the same "here is what will happen" sheet as the desktop: rows for *New / Newer in file / Same / Newer here*, and a Keep mine / Use the file's / Keep both choice for anything newer on the phone. Skipped or trimmed items are listed. Nothing is written until you confirm.
- Files from the desktop's **Export for mobile** arrive with splash art and icons embedded. Files that include desktop-only data (stats, builds) are accepted; that part is ignored.
- Later, not in the first slice: tapping a `.json` in Files or an email opens Summoner Mobile straight into the import sheet.

## Being honest about storage

Champions live in the app's own storage on the phone. **Uninstalling the app, or clearing its data, deletes them.** So:
- the app shows "last exported: …" in the ⋮ menu and, after a good amount of editing without an export, one quiet reminder to export;
- Android's own backup is turned on for the app's data where the system allows it (a bonus, not a promise).

## What is deliberately not here

Base stats, items and builds, theme audio and volume, light/dark toggle, Data Dragon sync, the updater screen (the APK is updated by installing the new one; the app can later say "a newer version exists" and link to it), and Advanced ability mode (roadmap).

## Open decisions

1. **Abilities: summary rows with sheets (above) or everything inline?** Recommendation: rows. Cooldown and Cost could stay inline since they are a single row each; I lean toward sheets for consistency, but it costs a tap per edit.
2. **Bottom tab bar (above) or top tabs?** Recommendation: bottom, for thumb reach; the bar hides while the keyboard is open.
3. **Preview as an eye button or a fourth tab?** Recommendation: a button. It is a presentation mode, not a place you edit.
