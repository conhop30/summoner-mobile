import { describe, expect, it } from 'vitest'
import { backDepth, handleBack, pushBackHandler } from './backStack'

describe('back stack', () => {
  it('hands Back to the top-most handler only, and reports when nothing handled it', () => {
    const calls: string[] = []
    expect(handleBack()).toBe(false)
    const removeSheet = pushBackHandler(() => calls.push('sheet'))
    const removeMenu = pushBackHandler(() => calls.push('menu'))
    expect(backDepth()).toBe(2)
    expect(handleBack()).toBe(true)
    expect(calls).toEqual(['menu'])
    removeMenu()
    handleBack()
    expect(calls).toEqual(['menu', 'sheet'])
    removeSheet()
    expect(handleBack()).toBe(false)
    expect(backDepth()).toBe(0)
  })

  it('removing the same handler twice is harmless', () => {
    const remove = pushBackHandler(() => {})
    remove()
    remove()
    expect(backDepth()).toBe(0)
  })
})
