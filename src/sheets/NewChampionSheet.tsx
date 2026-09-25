import { useEffect, useRef, useState } from 'react'
import Sheet from '../ui/Sheet'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export default function NewChampionSheet({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      const t = setTimeout(() => input.current?.focus(), 260)
      return () => clearTimeout(t)
    }
  }, [open])

  function submit() {
    onCreate(name)
  }

  return (
    <Sheet open={open} onClose={onClose} title="New champion">
      <input
        ref={input}
        className="field"
        placeholder="Champion name"
        value={name}
        maxLength={80}
        enterKeyHint="done"
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
      />
      <button className="btn primary" onClick={submit}>Create</button>
    </Sheet>
  )
}
