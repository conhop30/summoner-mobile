// Android's Back button closes the top-most sheet or menu first, and only then goes up a screen.
// Anything that opens on top of a screen registers a handler here while it is open.

type Handler = () => void
const stack: Handler[] = []

export function pushBackHandler(handler: Handler): () => void {
  stack.push(handler)
  return () => {
    const index = stack.lastIndexOf(handler)
    if (index >= 0) stack.splice(index, 1)
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
