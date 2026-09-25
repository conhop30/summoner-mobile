import { describe, expect, it } from 'vitest'
import { keyboardCover } from './keyboard'

describe('keyboardCover', () => {
  it('is zero with no keyboard', () => {
    expect(keyboardCover(783, 0, 783)).toBe(0)
  })

  it('is the part of the page below the visual viewport', () => {
    expect(keyboardCover(783, 0, 423)).toBe(360)
  })

  it('counts a visual viewport the browser panned down (numbers from Chrome on Android)', () => {
    // 783px page, viewport 423px tall and scrolled 62px down: the keyboard covers the bottom 298px.
    expect(keyboardCover(783, 61.7, 423.2)).toBeCloseTo(298.1, 0)
  })

  it('ignores a browser toolbar showing or hiding', () => {
    expect(keyboardCover(783, 0, 727)).toBe(0)
  })
})
