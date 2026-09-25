import { describe, expect, it } from 'vitest'
import { base64ToBlob, blobToBase64, fitWithin, imageUrl } from './image'
import { sanitizeImage } from '../interchange/sanitize'

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('fitWithin', () => {
  it('shrinks the long side to the limit and keeps the shape', () => {
    expect(fitWithin(4000, 2000, 1920)).toEqual({ width: 1920, height: 960 })
    expect(fitWithin(2000, 4000, 1920)).toEqual({ width: 960, height: 1920 })
  })
  it('never enlarges', () => {
    expect(fitWithin(300, 200, 1920)).toEqual({ width: 300, height: 200 })
  })
  it('never returns a zero side', () => {
    expect(fitWithin(10000, 1, 1920).height).toBe(1)
  })
})

describe('base64 helpers', () => {
  it('round-trips bytes exactly, including large data', async () => {
    const bytes = new Uint8Array(200_000).map((_, i) => (i * 31) % 256)
    const blob = new Blob([bytes], { type: 'application/octet-stream' })
    const back = base64ToBlob(await blobToBase64(blob), 'application/octet-stream')
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(bytes)
  })

  it('a real PNG survives the trip and is still accepted by the shared image check', async () => {
    const again = await blobToBase64(base64ToBlob(PNG, 'image/png'))
    expect(again).toBe(PNG)
    expect(sanitizeImage({ mime: 'image/png', data: again }, () => {}, 'test')).toEqual({ mime: 'image/png', data: PNG })
  })
})

describe('imageUrl', () => {
  it('returns nothing for no image, and the same URL each time for the same image', () => {
    expect(imageUrl(undefined)).toBeUndefined()
    const ref = { mime: 'image/png' as const, data: PNG }
    expect(imageUrl(ref)).toBe(imageUrl(ref))
    expect(imageUrl(ref)).toMatch(/^blob:/)
  })
})
