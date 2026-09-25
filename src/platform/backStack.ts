// Android's Back button closes the top-most sheet or menu first, and only then goes up a screen.
// Anything that opens on top of a screen registers a handler here while it is open.

type Handler = () => void
const stack: Handler[] = []

// The installed web app has no Back button events, only browser history, so the web build hooks in
// here to give each open sheet a history entry (see webHistory.ts). The Android shell leaves these unset.
export interface StackHooks {
  pushed: () => void
  released: () => void
}
let hooks: StackHooks | null = null

export function setStackHooks(next: StackHooks | null): void {
  hooks = next
}

export function pushBackHandler(handler: Handler): () => void {
  stack.push(handler)
  hooks?.pushed()
  return () => {
    const index = stack.lastIndexOf(handler)
    if (index < 0) return
    stack.splice(index, 1)
    hooks?.released()
  }
}

// Returns true if something on top handled it.
export function handleBack(): boolean {
  const top = stack[stack.length - 1]
  if (!top) return false
  top()
  return true
}

export function backDepth(): number {
  return stack.length
}
