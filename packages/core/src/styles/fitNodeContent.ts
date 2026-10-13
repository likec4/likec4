import type { ElementShape, IconPosition, ShapeSize } from './types'

export interface FitNodeContentInput {
  title: string
  shape: ElementShape
  size: ShapeSize
  /**
   * Node box in pixels
   */
  width: number
  height: number
  /**
   * Base values in pixels (from theme)
   */
  padding: number
  textSize: number
  iconSize: number
  hasIcon: boolean
  iconPosition: IconPosition
  hasTechnology: boolean
  hasDescription: boolean
}

export interface FittedNodeContent {
  /**
   * Title font size in pixels
   */
  textSize: number
  /**
   * Icon size in pixels
   */
  iconSize: number
  /**
   * Maximum number of title lines
   */
  maxLines: number
  /**
   * Maximum characters per title line
   */
  maxchars: number
}

// Rough average glyph width relative to font size
const CharWidthRatio = 0.55
const TitleLineHeight = 1.25
const SecondaryLineHeight = 1.3
const ContentGap = 8
const IconGap = 16
const MinTextSize = 9
const MinTextSizeRatio = 0.5
const ShrinkStep = 0.92

function contentBox({ shape, width, height, padding }: FitNodeContentInput) {
  let left = padding + 8
  let right = padding + 8
  let top = padding
  let bottom = padding
  // Mirrors paddings in elementNodeData recipe
  switch (shape) {
    case 'queue':
    case 'mobile':
      left = 46
      right = 16
      break
    case 'bucket':
      left = right = padding + 20
      break
    case 'component':
      left = padding + 30
      break
    case 'cylinder':
    case 'storage':
      top = 30
      break
    case 'browser':
      top = 32
      bottom = 28
      break
  }
  return {
    width: Math.max(0, width - left - right),
    height: Math.max(0, height - top - bottom),
  }
}

/**
 * Counts lines after greedy word wrap, words longer than `maxchars` are split
 */
export function countWrappedLines(text: string, maxchars: number): number {
  const limit = Math.max(1, maxchars)
  let lines = 0
  for (const paragraph of text.split('\n')) {
    let current = 0
    lines++
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const len = word.length
      if (current === 0) {
        lines += Math.ceil(len / limit) - 1
        current = len % limit || limit
        continue
      }
      if (current + 1 + len <= limit) {
        current += 1 + len
        continue
      }
      lines += Math.ceil(len / limit)
      current = len % limit || limit
    }
  }
  return lines
}

/**
 * Computes title font size and icon size, so that content fits into a node of fixed size.
 * Uses heuristic text metrics, shared by layout and renderer.
 */
export function fitNodeContent(input: FitNodeContentInput): FittedNodeContent {
  const { title, size, hasIcon, iconPosition } = input
  const box = contentBox(input)
  const isSmOrXs = size === 'xs' || size === 'sm'
  const maxLines = isSmOrXs ? 2 : 3
  const iconOnSide = hasIcon && (iconPosition === 'left' || iconPosition === 'right')

  let iconSize = input.iconSize
  if (hasIcon) {
    iconSize = iconOnSide
      ? Math.min(iconSize, box.height, box.width * 0.3)
      : Math.min(iconSize, box.width, box.height * 0.35)
    iconSize = Math.max(0, Math.floor(iconSize))
  }

  let textWidth = box.width
  let textHeight = box.height
  if (hasIcon) {
    if (iconOnSide) {
      textWidth -= iconSize + IconGap
    } else {
      textHeight -= iconSize + IconGap
    }
  }

  const showTechnology = input.hasTechnology && size !== 'xs'
  const showDescription = input.hasDescription && size !== 'xs'

  const reserved = (fs: number) => {
    let h = 0
    if (showTechnology) {
      h += fs * 0.635 * SecondaryLineHeight + ContentGap
    }
    if (showDescription) {
      h += fs * 0.74 * SecondaryLineHeight + ContentGap
    }
    return h
  }

  const maxcharsFor = (fs: number) => Math.max(1, Math.floor(textWidth / (fs * CharWidthRatio)))

  const fits = (fs: number) => {
    const lines = countWrappedLines(title, maxcharsFor(fs))
    return lines <= maxLines && lines * fs * TitleLineHeight + reserved(fs) <= textHeight
  }

  const minTextSize = Math.min(input.textSize, Math.max(MinTextSize, input.textSize * MinTextSizeRatio))
  let textSize = input.textSize
  while (textSize > minTextSize && !fits(textSize)) {
    textSize = Math.max(minTextSize, textSize * ShrinkStep)
  }
  textSize = Math.round(textSize * 100) / 100

  return {
    textSize,
    iconSize,
    maxLines,
    maxchars: maxcharsFor(textSize),
  }
}
