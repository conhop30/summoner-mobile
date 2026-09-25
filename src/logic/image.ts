// Turning a picked photo into an interchange image (a small JPEG or PNG, base64), and back into
// something an <img> can show. Pure helpers are split from the canvas work so they can be tested.

import type { ImageMime, ImageRef } from '../interchange/types'

export type ImageKind = 'splash' | 'icon'

// The same limits the desktop's export uses (contract/SPEC.md, Images).
export const IMAGE_SPECS: Record<ImageKind, { maxSide: number; mime: ImageMime }> = {
  splash: { maxSide: 1920, mime: 'image/jpeg' },
  icon: { maxSide: 256, mime: 'image/png' },
}
export const MAX_DECODED_BYTES = 3 * 1024 * 1024

export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export function base64ToBlob(data: string, mime: string): Blob {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(binary)
}

// An <img> src for an embedded image. Cached per image object, so a re-render doesn't rebuild it.
const urls = new WeakMap<ImageRef, string>()
export function imageUrl(ref: ImageRef | undefined): string | undefined {
  if (!ref) return undefined
  let url = urls.get(ref)
  if (!url) {
    url = URL.createObjectURL(base64ToBlob(ref.data, ref.mime))
    urls.set(ref, url)
  }
  return url
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode the image'))), mime, quality))
}

// Reads a picked file (any format the WebView can show), shrinks it, and returns it as an embedded image.
export async function fileToImageRef(file: Blob, kind: ImageKind): Promise<ImageRef> {
  const { maxSide, mime } = IMAGE_SPECS[kind]
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not read the image')
    if (mime === 'image/jpeg') { ctx.fillStyle = '#010a13'; ctx.fillRect(0, 0, width, height) } // transparent → navy, not black
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)

    for (const quality of mime === 'image/jpeg' ? [0.88, 0.75, 0.6] : [undefined]) {
      const blob = await toBlob(canvas, mime, quality)
      if (blob.size <= MAX_DECODED_BYTES) return { mime, data: await blobToBase64(blob) }
    }
    throw new Error('That image is too large even after shrinking')
  } finally {
    bitmap.close()
  }
}
