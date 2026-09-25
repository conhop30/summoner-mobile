import { useEffect } from 'react'
import { create } from 'zustand'
import './Toast.css'

interface ToastState {
  message: string | null
  id: number
  show: (message: string) => void
  hide: () => void
}

export const useToast = create<ToastState>(set => ({
  message: null,
  id: 0,
  show: message => set(s => ({ message, id: s.id + 1 })),
  hide: () => set({ message: null }),
}))

// One short line at the bottom of the screen that goes away by itself.
export default function Toast() {
  const { message, id, hide } = useToast()
  useEffect(() => {
    if (!message) return
    const t = setTimeout(hide, 4200)
    return () => clearTimeout(t)
  }, [message, id, hide])
  if (!message) return null
  return <div className="toast" role="status" onClick={hide}>{message}</div>
}
