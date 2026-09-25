import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

// A textarea that grows to fit its text, so a long lore or description never scrolls inside a
// little box. (CSS `field-sizing` would do it, but older browsers don't have it.)
export default function AutoTextarea({ value, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return <textarea ref={ref} className={`field field-area${className ? ` ${className}` : ''}`} value={value} rows={1} {...rest} />
}
