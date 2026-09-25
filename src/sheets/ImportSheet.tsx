import { useState } from 'react'
import Sheet from '../ui/Sheet'
import { applyImport, changeCount, type ImportPlan, type ImportStatus, type LocalNewerChoice } from '../logic/transfer'
import { useLibrary } from '../store/library'
import './ImportSheet.css'

const STATUS_LABEL: Record<ImportStatus, string> = {
  new: 'New',
  update: 'Newer in file',
  unchanged: 'Same',
  'local-newer': 'Newer here',
}

const CHOICES: { value: LocalNewerChoice; label: string; hint: string }[] = [
  { value: 'keep-mine', label: 'Keep mine', hint: 'Leave these champions as they are.' },
  { value: 'take-theirs', label: "Use the file's", hint: 'Replace their story and ability text with the file’s.' },
  { value: 'keep-both', label: 'Keep both', hint: 'Add the file’s version as a separate copy.' },
]

function when(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

interface Props {
  plan: ImportPlan | null
  fileName: string
  onClose: () => void
  onDone: (message: string) => void
  onError: (message: string) => void
}

// What an import would do, shown before anything is written.
export default function ImportSheet({ plan, fileName, onClose, onDone, onError }: Props) {
  const [choice, setChoice] = useState<LocalNewerChoice>('keep-mine')
  const [busy, setBusy] = useState(false)
  const put = useLibrary(s => s.put)

  const localNewer = plan?.items.filter(i => i.status === 'local-newer').length ?? 0
  const willChange = plan ? changeCount(plan, choice) : 0

  async function apply() {
    if (!plan) return
    setBusy(true)
    try {
      const outcome = applyImport(plan, choice)
      await put(outcome.champions)
      const parts = [
        outcome.added && `${outcome.added} added`,
        outcome.updated && `${outcome.updated} updated`,
        outcome.copies && `${outcome.copies} kept as copies`,
        outcome.skipped && `${outcome.skipped} left as they were`,
      ].filter(Boolean)
      onDone(`Import finished: ${parts.join(', ') || 'nothing to change'}.`)
    } catch {
      onError('The import could not be saved. Nothing was changed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={plan !== null} onClose={onClose} title="Import champions">
      {plan && (
        <>
          <div className="import-file">
            <span className="import-file-name">{fileName}</span>
            <span className="import-file-scope">{plan.scope === 'concept' ? 'Story and ability text' : 'Full backup'}</span>
          </div>
          {plan.scope === 'full' && (
            <p className="muted">This backup also holds stats, builds and ability numbers. Summoner Mobile leaves those out.</p>
          )}

          <ul className="import-list">
            {plan.items.map(({ record, status, localAt }) => (
              <li key={record.id} className="import-row">
                <span className="import-name">{record.identity.name}</span>
                <span className={`import-chip import-chip-${status}`}>{STATUS_LABEL[status]}</span>
                {status === 'local-newer' && <span className="import-dates">here {when(localAt)} · file {when(record.concept_updated_at)}</span>}
              </li>
            ))}
          </ul>

          {localNewer > 0 && (
            <fieldset className="import-choice">
              <legend>{localNewer === 1 ? '1 champion is' : `${localNewer} champions are`} newer here than in this file</legend>
              {CHOICES.map(c => (
                <label key={c.value} className={`import-option${choice === c.value ? ' on' : ''}`}>
                  <input type="radio" name="import-choice" checked={choice === c.value} onChange={() => setChoice(c.value)} />
                  <span>
                    <span className="import-option-label">{c.label}</span>
                    <span className="import-option-hint">{c.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {plan.warnings.length > 0 && (
            <details className="import-warnings">
              <summary>{plan.warnings.length} thing{plan.warnings.length === 1 ? ' was' : 's were'} skipped or trimmed</summary>
              <ul>{plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </details>
          )}

          <div className="btn-row">
            <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn primary" onClick={apply} disabled={busy || willChange === 0}>
              {busy ? 'Importing…' : willChange === 0 ? 'Nothing to import' : `Import ${willChange}`}
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
