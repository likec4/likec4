/**
 * Lightweight static SVG snapshot rendered into a `.likec4-view` host's light DOM.
 * Displayed via shadow `<slot>` before the interactive React Flow view initializes,
 * eliminating blank flashes across preview reloads.
 */
import {
  type CustomColorDefinitions,
  type ElementColorValues,
  type RelationshipColorValues,
  type ThemeColorValues,
  defaultTheme,
} from '@likec4/core/styles'
import { escapeHtml } from './html.ts'

export const ID_TOKEN = '__LIKEC4_HOST__'
export const PAD = 16
export const MIN_HEIGHT = 160

const FONT = '\'IBM Plex Sans Variable\',\'IBM Plex Sans\',system-ui,-apple-system,\'Segoe UI\',sans-serif'

export interface StaticViewBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface StaticTextValue {
  readonly txt?: string | null | undefined
  readonly md?: string | null | undefined
}

export interface StaticNode {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly level?: number | undefined
  readonly shape?: string | undefined
  readonly color?: string | undefined
  readonly title?: string | StaticTextValue | null | undefined
  readonly technology?: string | StaticTextValue | null | undefined
  readonly description?: string | StaticTextValue | null | undefined
  readonly children?: ReadonlyArray<string> | undefined
  readonly style?: {
    readonly opacity?: number | undefined
    readonly border?: string | undefined
  } | undefined
}

export interface StaticEdge {
  readonly points?: ReadonlyArray<readonly [number, number]> | undefined
  readonly endpoint?: readonly [number, number] | undefined
  readonly color?: string | undefined
  readonly line?: string | undefined
  readonly head?: string | undefined
  readonly tail?: string | undefined
  readonly label?: string | StaticTextValue | null | undefined
  readonly labelBBox?: StaticViewBounds | null | undefined
}

export interface StaticViewLike {
  readonly id?: string | undefined
  readonly hash?: string | undefined
  readonly _type?: string | undefined
  readonly title?: string | StaticTextValue | null | undefined
  readonly bounds?: StaticViewBounds | undefined
  readonly nodes?: ReadonlyArray<StaticNode> | undefined
  readonly edges?: ReadonlyArray<StaticEdge> | undefined
}

function attr(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  switch (typeof value) {
    case 'string':
      return escapeHtml(value)
    case 'number':
    case 'boolean':
      return escapeHtml(String(value))
    default:
      return ''
  }
}

function colorsMap(): Readonly<Record<string, ThemeColorValues>> {
  return defaultTheme.colors as Readonly<Record<string, ThemeColorValues>>
}

function elementColors(color: string | undefined, custom?: CustomColorDefinitions): ElementColorValues {
  const palette = colorsMap()
  const themed = palette[color ?? 'primary'] ?? (color ? custom?.[color] : undefined)
  return themed?.elements ?? palette['primary']!.elements
}

function relationshipColors(color: string | undefined, custom?: CustomColorDefinitions): RelationshipColorValues {
  const palette = colorsMap()
  const themed = palette[color ?? 'gray'] ?? (color ? custom?.[color] : undefined)
  return themed?.relationships ?? palette['gray']!.relationships
}

function plainText(value: string | StaticTextValue | null | undefined): string {
  if (typeof value === 'string') {
    return value
  }
  if (value && typeof value === 'object') {
    return value.txt ?? value.md ?? ''
  }
  return ''
}

function wrapLines(raw: string, fontSize: number, maxWidth: number, maxLines: number): string[] {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) {
    return []
  }
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * 0.56)))
  const words = clean.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) {
    lines.push(current)
  }

  if (lines.length > maxLines) {
    lines.length = maxLines
    const last = lines[maxLines - 1]!
    lines[maxLines - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}…`
  }

  return lines.map((line) => (line.length > maxChars ? `${line.slice(0, maxChars - 1)}…` : line))
}

function bezierPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) {
    return ''
  }
  let d = `M${points[0]![0]},${points[0]![1]}`
  let i = 1
  for (; i + 2 < points.length; i += 3) {
    const c1 = points[i]!
    const c2 = points[i + 1]!
    const p = points[i + 2]!
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`
  }
  for (; i < points.length; i++) {
    d += ` L${points[i]![0]},${points[i]![1]}`
  }
  return d
}

function renderNodeShape(node: StaticNode, colors: ElementColorValues): string {
  const { x, y, width: w, height: h, shape } = node
  if (shape === 'storage' || shape === 'cylinder') {
    const ry = Math.min(18, h / 6)
    return `<path d="M${x},${y + ry} a${w / 2},${ry} 0 0,1 ${w},0 v${h - 2 * ry} a${
      w / 2
    },${ry} 0 0,1 ${-w},0 z" fill="${attr(colors.fill)}" stroke="${attr(colors.stroke)}"/>`
      + `<path d="M${x},${y + ry} a${w / 2},${ry} 0 0,0 ${w},0" fill="none" stroke="${attr(colors.stroke)}"/>`
  }
  if (shape === 'queue') {
    const rx = Math.min(18, w / 6)
    return `<path d="M${x + rx},${y} h${w - 2 * rx} a${rx},${h / 2} 0 0,1 0,${h} h${-(w - 2 * rx)} a${rx},${
      h / 2
    } 0 0,1 0,${-h} z" fill="${attr(colors.fill)}" stroke="${attr(colors.stroke)}"/>`
  }
  const radius = shape === 'person' ? 12 : 6
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${attr(colors.fill)}" stroke="${
    attr(colors.stroke)
  }"/>`
}

function renderLeafLabel(node: StaticNode, colors: ElementColorValues): string {
  const cx = node.x + node.width / 2
  const maxW = node.width - 32
  const titleLines = wrapLines(plainText(node.title), 19, maxW, 2)
  const techLines = node.technology ? wrapLines(`[${plainText(node.technology)}]`, 12, maxW, 1) : []
  const descLines = wrapLines(plainText(node.description), 14, maxW, 3)

  const rows: Array<{ text: string; size: number; color: string; weight: number }> = [
    ...titleLines.map((line) => ({ text: line, size: 19, color: colors.hiContrast, weight: 500 })),
    ...techLines.map((line) => ({ text: line, size: 12, color: colors.loContrast, weight: 400 })),
    ...descLines.map((line) => ({ text: line, size: 14, color: colors.loContrast, weight: 400 })),
  ]
  if (rows.length === 0) {
    return ''
  }

  const lineHeight = (row: { size: number }) => row.size * 1.25
  const totalHeight = rows.reduce((sum, row) => sum + lineHeight(row), 0) + (rows.length > titleLines.length ? 6 : 0)
  let y = node.y + node.height / 2 - totalHeight / 2
  let out = ''

  rows.forEach((row, index) => {
    if (index === titleLines.length && index > 0) {
      y += 6
    }
    y += lineHeight(row)
    out += `<text x="${cx}" y="${
      y - row.size * 0.28
    }" text-anchor="middle" font-size="${row.size}" font-weight="${row.weight}" fill="${attr(row.color)}">${
      escapeHtml(row.text)
    }</text>`
  })
  return out
}

function renderCompound(node: StaticNode, colors: ElementColorValues): string {
  const opacity = Math.min(1, Math.max(0, (node.style?.opacity ?? 15) / 100))
  const dash = node.style?.border === 'solid' || node.style?.border === 'none' ? '' : ' stroke-dasharray="6 4"'
  const stroke = node.style?.border === 'none' ? 'none' : colors.stroke
  const titleText = plainText(node.title).toUpperCase()
  return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="8" fill="${
    attr(colors.fill)
  }" fill-opacity="${opacity}" stroke="${attr(stroke)}"${dash}/>`
    + `<text x="${node.x + 14}" y="${node.y + 22}" font-size="13" font-weight="600" letter-spacing="0.4" fill="${
      attr(colors.stroke)
    }">${escapeHtml(titleText)}</text>`
}

/**
 * Computes the light-DOM frame style matching the React Flow frame in the preview app.
 */
export function frameStyle(bounds: { readonly width: number; readonly height: number }, maxHeight: number): string {
  const w = Math.ceil(bounds.width + 2 * PAD)
  const h = Math.ceil(bounds.height + 2 * PAD)
  return `display:block;width:min(100%,${w}px);aspect-ratio:${w}/${h};max-height:${maxHeight}px;min-height:${
    Math.min(MIN_HEIGHT, maxHeight)
  }px;margin:0 auto`
}

/**
 * Renders a static SVG snapshot for a layouted view, or `''` when unavailable
 * (e.g. sequence layout variant of dynamic views).
 */
export function renderStaticSvg(
  view: StaticViewLike | undefined,
  variant: 'diagram' | 'sequence',
  maxHeight: number,
  customColors?: CustomColorDefinitions,
): string {
  if (!view?.bounds || !Array.isArray(view.nodes)) {
    return ''
  }
  if (view._type === 'dynamic' && variant === 'sequence') {
    return ''
  }

  const bounds = view.bounds
  const viewBox = `${bounds.x - PAD} ${bounds.y - PAD} ${bounds.width + 2 * PAD} ${bounds.height + 2 * PAD}`
  const sortedNodes = [...view.nodes].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))

  let body = ''
  for (const node of sortedNodes) {
    if (node.children && node.children.length > 0) {
      body += renderCompound(node, elementColors(node.color, customColors))
    }
  }
  for (const node of sortedNodes) {
    if (node.children && node.children.length > 0) {
      continue
    }
    const colors = elementColors(node.color, customColors)
    body += `<g>${renderNodeShape(node, colors)}${renderLeafLabel(node, colors)}</g>`
  }

  let defs = ''
  const markerIds = new Set<string>()
  for (const edge of view.edges ?? []) {
    if (!Array.isArray(edge.points) || edge.points.length < 2) {
      continue
    }
    const rc = relationshipColors(edge.color, customColors)
    const markerId = `${ID_TOKEN}-m${rc.line.replace(/[^a-zA-Z0-9]/g, '')}`
    if (!markerIds.has(markerId)) {
      markerIds.add(markerId)
      defs +=
        `<marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${
          attr(rc.line)
        }"/></marker>`
    }
    let dash = ''
    if (edge.line === 'dotted') {
      dash = ' stroke-dasharray="2 4"'
    } else if (edge.line && edge.line !== 'solid') {
      dash = ' stroke-dasharray="8 6"'
    }
    const head = edge.head === 'none' ? '' : ` marker-end="url(#${markerId})"`
    const tail = edge.tail && edge.tail !== 'none' ? ` marker-start="url(#${markerId})"` : ''
    const points = edge.endpoint && head ? [...edge.points, edge.endpoint] : edge.points
    body += `<path d="${bezierPath(points)}" fill="none" stroke="${
      attr(rc.line)
    }" stroke-width="2"${dash}${head}${tail}/>`

    const label = plainText(edge.label)
    if (label && edge.labelBBox) {
      const lb = edge.labelBBox
      const firstLine = (label.split('\n')[0] ?? '').slice(0, 80)
      body +=
        `<rect x="${lb.x - 2}" y="${lb.y - 1}" width="${lb.width + 4}" height="${lb.height + 2}" rx="3" fill="${
          attr(rc.labelBg)
        }" fill-opacity="0.75"/>`
        + `<text x="${lb.x + lb.width / 2}" y="${
          lb.y + lb.height / 2 + 4.5
        }" text-anchor="middle" font-size="13" fill="${attr(rc.label)}">${escapeHtml(firstLine)}</text>`
    }
  }

  const label = plainText(view.title) || view.id || 'LikeC4 view'
  return `<svg class="likec4-static" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" data-bounds="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${
    escapeHtml(label)
  }" style="${frameStyle(bounds, maxHeight)}" font-family="${escapeHtml(FONT)}">${
    defs ? `<defs>${defs}</defs>` : ''
  }${body}</svg>`
}
