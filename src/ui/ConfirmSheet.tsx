import Sheet from './Sheet'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmSheet({ open, title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="sheet-message">{message}</p>
      <div className="btn-row">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Sheet>
  )
}
