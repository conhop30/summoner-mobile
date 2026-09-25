import type { Champion } from '../../model/champion'

export interface TabProps {
  champion: Champion
  // Applies an edit to this champion (saved automatically; the stamp moves only if something changed).
  change: (edit: (c: Champion) => Champion) => void
}
