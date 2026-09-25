import type { Champion } from '../model/champion'
import { shareJsonFile } from '../platform'
import { useLibrary } from '../store/library'
import { buildExport, exportFileName } from './transfer'

// Writes the champions as a concept file and hands it to the share sheet. Returns false if the
// person closed the sheet without sending it anywhere.
export async function exportChampions(champions: Champion[]): Promise<boolean> {
  await useLibrary.getState().flush() // an export must include the last keystrokes
  const fresh = new Map(useLibrary.getState().champions.map(c => [c.id, c]))
  const current = champions.map(c => fresh.get(c.id) ?? c)
  const file = buildExport(current)
  const result = await shareJsonFile(exportFileName(current), JSON.stringify(file))
  if (result === 'cancelled') return false
  await useLibrary.getState().markExported()
  return true
}
