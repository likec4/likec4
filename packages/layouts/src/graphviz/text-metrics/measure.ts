import * as fontkit from 'fontkit'
import { IBMPlexSansFaces } from './fonts.generated'

type Font = fontkit.Font

/**
 * Font family of the diagram (see styled-system/preset/src/tokens/typography.ts)
 */
export const FontFamily = 'IBM Plex Sans'

/**
 * Faces of the font family (unicode-range subsets), the first face that has the glyph wins.
 * Loaded lazily on first measurement.
 */
let faces: Font[] | null = null
const facesByWeight = new Map<number, Font[]>()

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function loadFaces(): Font[] {
  return IBMPlexSansFaces.map(base64 => {
    const font = fontkit.create(decodeBase64(base64) as Buffer)
    if (!('layout' in font)) {
      throw new Error('Font collections are not supported')
    }
    return font
  })
}

function facesForWeight(weight: number): Font[] {
  let result = facesByWeight.get(weight)
  if (!result) {
    faces ??= loadFaces()
    result = faces.map(f => {
      const wght = f.variationAxes['wght']
      return wght && wght.default !== weight ? f.getVariation({ wght: weight }) : f
    })
    facesByWeight.set(weight, result)
  }
  return result
}

const ZeroWidthRe = /[​-‍]|\p{Variation_Selector}/u
const EmojiRe = /\p{Extended_Pictographic}/u
const WideRe = /[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}\p{scx=Hangul}　-〿＀-｠￠-￦]/u

/**
 * Estimates width (in em) of a character not covered by the font,
 * browser renders it with a system fallback font
 */
function fallbackEm(char: string): number {
  switch (true) {
    case ZeroWidthRe.test(char):
      return 0
    case EmojiRe.test(char):
      return 1.23
    case WideRe.test(char):
      return 1
    default:
      return 0.6
  }
}

/**
 * Measures text width in px, as it is shaped by the browser (kerning and ligatures included).
 * Text is split into runs by the face that has glyphs, like unicode-range faces in the browser.
 */
export function measureTextWidth(text: string, size: number, weight = 400): number {
  const fonts = facesForWeight(weight)
  let width = 0
  let run = ''
  let runFont: Font | null = null
  const flush = () => {
    if (run && runFont) {
      width += runFont.layout(run).advanceWidth * size / runFont.unitsPerEm
    }
    run = ''
  }
  for (const char of text) {
    const cp = char.codePointAt(0)!
    const font = fonts.find(f => f.hasGlyphForCodePoint(cp)) ?? null
    if (!font) {
      flush()
      runFont = null
      width += fallbackEm(char) * size
      continue
    }
    if (font !== runFont) {
      flush()
      runFont = font
    }
    run += char
  }
  flush()
  return width
}

const CanvasFontRe = /(?:(bold|\d{3})\s+)?(\d+(?:\.\d+)?)px/

function parseCanvasFont(font: string): { size: number; weight: number } {
  const m = CanvasFontRe.exec(font)
  if (!m) {
    return { size: 10, weight: 400 }
  }
  const weight = m[1] === 'bold' ? 700 : m[1] ? parseInt(m[1], 10) : 400
  return { size: parseFloat(m[2]!), weight }
}

/**
 * Minimal Canvas 2D context, which is enough for pretext
 */
class FontkitContext2D {
  font = '10px sans-serif'
  measureText(text: string) {
    const { size, weight } = parseCanvasFont(this.font)
    return { width: measureTextWidth(text, size, weight) }
  }
}

class FontkitOffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext() {
    return new FontkitContext2D()
  }
}

/**
 * Runs pretext with fontkit-backed measurements.
 *
 * Pretext creates its canvas context from global `OffscreenCanvas` on first measurement.
 * The global is replaced only for the duration of the (synchronous) call,
 * so measurements are the same in Node and in browsers, and the global stays untouched.
 */
export function withFontMetrics<T>(fn: () => T): T {
  const g = globalThis as { OffscreenCanvas?: unknown }
  const hadOwn = Object.prototype.hasOwnProperty.call(g, 'OffscreenCanvas')
  const original = g.OffscreenCanvas
  g.OffscreenCanvas = FontkitOffscreenCanvas
  try {
    return fn()
  } finally {
    if (hadOwn) {
      g.OffscreenCanvas = original
    } else {
      delete g.OffscreenCanvas
    }
  }
}

/**
 * Canvas font shorthand for pretext
 */
export function canvasFont(size: number, weight = 400): string {
  return `${weight !== 400 ? `${weight} ` : ''}${size}px "${FontFamily}"`
}
