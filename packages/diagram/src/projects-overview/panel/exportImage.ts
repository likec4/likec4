import type { BBox } from '@likec4/core/types'

export type OverviewImageFormat = 'png' | 'jpeg'

const PADDING = 32
const MAX_PIXEL_RATIO = 2
const JPEG_QUALITY = 0.95
const MAX_CANVAS_SIDE = 8_000
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

/**
 * Saves the whole overview, not only the visible area, as an image file.
 *
 * Requires: `viewport` is the XYFlow viewport element, `bounds` covers the shown content.
 */
export async function exportOverviewAsImage(params: {
  viewport: HTMLElement
  bounds: BBox
  format: OverviewImageFormat
  filename: string
}): Promise<void> {
  const { viewport, bounds, format, filename } = params
  const { toBlob, toJpeg } = await import('html-to-image')
  const width = Math.ceil(bounds.width + PADDING * 2)
  const height = Math.ceil(bounds.height + PADDING * 2)
  const options = {
    width,
    height,
    pixelRatio: Math.min(MAX_PIXEL_RATIO, MAX_CANVAS_SIDE / Math.max(width, height)),
    backgroundColor: resolveBackgroundColor(viewport),
    cacheBust: true,
    imagePlaceholder: TRANSPARENT_PIXEL,
    quality: JPEG_QUALITY,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${PADDING - bounds.x}px, ${PADDING - bounds.y}px) scale(1)`,
    },
  }
  // toBlob always encodes PNG, so JPEG goes through a data URL
  const blob = format === 'jpeg'
    ? await (await fetch(await toJpeg(viewport, options))).blob()
    : await toBlob(viewport, options)
  if (!blob) {
    throw new Error(`Failed to create ${format} blob`)
  }
  downloadBlob(blob, `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`)
}

/**
 * Saves text, for example DOT or D2 source, as a file.
 */
export function downloadText(content: string, filename: string): void {
  downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

/**
 * First opaque background up the tree. JPEG has no alpha channel.
 */
function resolveBackgroundColor(element: HTMLElement): string {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const color = getComputedStyle(current).backgroundColor
    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
      return color
    }
  }
  return '#ffffff'
}
