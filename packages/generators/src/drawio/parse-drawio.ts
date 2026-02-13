/**
 * Parse DrawIO (mxGraph) XML and generate LikeC4 source code.
 * Extracts vertices as elements and edges as relations; preserves colors, descriptions,
 * technology and other compatible attributes for full bidirectional compatibility.
 * Supports both uncompressed (raw mxGraphModel inside <diagram>) and compressed
 * (base64 + deflate, draw.io default) diagram content.
 */

import pako from 'pako'
import {
  CONTAINER_TITLE_AREA_HEIGHT_RATIO,
  CONTAINER_TITLE_AREA_MAX_HEIGHT_PX,
  CONTAINER_TITLE_AREA_TOLERANCE,
  DRAWIO_DIAGRAM_ID_PREFIX,
  DRAWIO_PAGE_LINK_PREFIX,
} from './constants'
import { decodeXmlEntities } from './xml-utils'

/** Normalize unknown to a string for error messages (Error → message; else String). */
export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export interface DrawioCell {
  id: string
  value?: string
  parent?: string
  source?: string
  target?: string
  vertex?: boolean
  edge?: boolean
  style?: string
  x?: number
  y?: number
  width?: number
  height?: number
  /** From style fillColor= or mxUserObject */
  fillColor?: string
  strokeColor?: string
  /** From style likec4Description / mxUserObject (exported by LikeC4) */
  description?: string
  technology?: string
  /** From style likec4Notes */
  notes?: string
  /** From style likec4Tags (comma-separated) */
  tags?: string
  /** From style likec4NavigateTo (view id for drill-down link) */
  navigateTo?: string
  /** From style likec4Icon (icon name) */
  icon?: string
  /** Edge only: from style endArrow (draw.io: none, block, open, diamond, oval) */
  endArrow?: string
  /** Edge only: from style startArrow */
  startArrow?: string
  /** Edge only: from style dashed=1 */
  dashed?: string
  /** Edge only: from style dashPattern (e.g. "1 1" for dotted) */
  dashPattern?: string
  /** From style likec4Summary (vertex) */
  summary?: string
  /** From style likec4Links (vertex; JSON array of {url, title?}) */
  links?: string
  /** From style link (Draw.io native cell link URL; vertex) */
  link?: string
  /** From style likec4Border (vertex: solid|dashed|dotted|none) */
  border?: string
  /** From style strokeWidth (vertex; numeric for round-trip comment) */
  strokeWidth?: string
  /** From style likec4ColorName (vertex; theme/custom color name for roundtrip) */
  colorName?: string
  /** From style likec4Size (vertex; xs/sm/md/lg/xl) */
  size?: string
  /** From style likec4Padding (vertex) */
  padding?: string
  /** From style likec4TextSize (vertex) */
  textSize?: string
  /** From style likec4IconPosition (vertex) */
  iconPosition?: string
  /** From style opacity (vertex; 0-100) */
  opacity?: string
  /** From style likec4RelationshipKind (edge) */
  relationshipKind?: string
  /** From style likec4Notation (edge) */
  notation?: string
  /** From style likec4Metadata (edge; JSON object for relation metadata block) */
  metadata?: string
  /** From mxUserObject/data keys not mapped to fields above (JSON object for round-trip comment) */
  customData?: string
  /** From mxGeometry Array/mxPoint (edge waypoints; JSON array of [x,y][]) */
  edgePoints?: string
}

/** Edge cell with required source and target; use after filtering with isEdgeWithEndpoints. */
type DrawioEdgeWithEndpoints = DrawioCell & { source: string; target: string }
function isEdgeWithEndpoints(c: DrawioCell): c is DrawioEdgeWithEndpoints {
  return c.edge === true && typeof c.source === 'string' && typeof c.target === 'string'
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}="([^"]*)"`, 'i')
  const m = re.exec(attrs)
  return m ? m[1] : undefined
}

/** Find end of XML open tag (first unquoted '>'). Avoids regex for S5852. */
function findOpenTagEnd(xml: string, start: number): number {
  let inQuote = false
  let i = start
  while (i < xml.length) {
    const c = xml[i]
    if (c === '"') inQuote = !inQuote
    else if (c === '>' && !inQuote) return i
    i += 1
  }
  return -1
}

/** Find start of tag '<tagName' (case-insensitive). */
function indexOfTagStart(xml: string, tagName: string, fromIndex: number): number {
  const lower = xml.toLowerCase()
  const needle = `<${tagName.toLowerCase()}`
  return lower.indexOf(needle, fromIndex)
}

/** Find start of closing tag '</tagName>' (case-insensitive). */
function indexOfClosingTag(xml: string, tagName: string, fromIndex: number): number {
  const lower = xml.toLowerCase()
  const needle = `</${tagName.toLowerCase()}>`
  return lower.indexOf(needle, fromIndex)
}

/** Parse numeric attribute; returns undefined if missing or not a number. */
function parseNum(str: string | undefined): number | undefined {
  if (str === undefined || str === '') return undefined
  const num = Number.parseFloat(str)
  return Number.isNaN(num) ? undefined : num
}

/** Get style value decoded for URI component; undefined if missing or empty. */
function getDecodedStyle(styleMap: Map<string, string>, key: string): string | undefined {
  const v = styleMap.get(key)
  return v != null && v !== '' ? decodeURIComponent(v) : undefined
}

/** Parse DrawIO style string (semicolon-separated key=value) into a map. */
function parseStyle(style: string | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!style) return map
  for (const part of style.split(';')) {
    const eq = part.indexOf('=')
    if (eq > 0) {
      const k = part.slice(0, eq).trim()
      const v = part.slice(eq + 1).trim()
      if (k && v) map.set(k.toLowerCase(), v)
    }
  }
  return map
}

/** Keys we map to dedicated DrawioCell fields; other data keys go to customData. */
const MAPPED_DATA_KEYS = new Set([
  'likec4description',
  'likec4technology',
])

/** Extract all <data key="...">...</data> from mxUserObject inner XML. */
function parseAllUserData(fullTag: string): Record<string, string> {
  const out: Record<string, string> = {}
  // Tempered greedy for inner content to avoid super-linear backtracking (S5852)
  const dataRe = /<data\s+key="([^"]*)"[^>]*>((?:(?!<\/data>)[\s\S])*)<\/data>/gi
  let match
  while ((match = dataRe.exec(fullTag)) !== null) {
    const key = match[1]?.trim()
    const raw = match[2]?.trim()
    if (key && raw !== undefined) out[key] = decodeXmlEntities(raw)
  }
  return out
}

const GEOM_INNER_RE = /<mxGeometry[^>]*>((?:(?!<\/mxGeometry>)[\s\S])*)<\/mxGeometry>/i

/** Extract edge waypoints from mxGeometry Array/mxPoint inside cell XML. Returns JSON array of [x,y][] or undefined. */
function parseEdgePoints(fullTag: string): string | undefined {
  // Use tempered greedy (?:.(?!<\/mxGeometry>))* to avoid super-linear backtracking (S5852)
  const geomMatch = GEOM_INNER_RE.exec(fullTag)
  if (!geomMatch?.[1]) return undefined
  const inner = geomMatch[1]
  const points: [number, number][] = []
  const mxPointTagRe = /<mxPoint\s[^>]*\/?>/gi
  let tagMatch
  while ((tagMatch = mxPointTagRe.exec(inner)) !== null) {
    const tag = tagMatch[0]
    const px = parseNum(getAttr(tag, 'x'))
    const py = parseNum(getAttr(tag, 'y'))
    if (px !== undefined && py !== undefined) points.push([px, py])
  }
  if (points.length === 0) return undefined
  return JSON.stringify(points)
}

/** Extract LikeC4 custom data from mxUserObject/data inside cell XML. */
function parseUserData(fullTag: string): { description?: string; technology?: string; customData?: string } {
  const all = parseAllUserData(fullTag)
  const out: { description?: string; technology?: string; customData?: string } = {}
  if (all['likec4Description'] != null) out.description = all['likec4Description']
  if (all['likec4Technology'] != null) out.technology = all['likec4Technology']
  const rest: Record<string, string> = {}
  for (const [k, v] of Object.entries(all)) {
    if (!MAPPED_DATA_KEYS.has(k.toLowerCase()) && v != null && v !== '') rest[k] = v
  }
  if (Object.keys(rest).length > 0) out.customData = JSON.stringify(rest)
  return out
}

/** Regex to extract viewId from Draw.io internal page link (see DRAWIO_PAGE_LINK_PREFIX). */
const NAV_LINK_RE = new RegExp(`^${DRAWIO_PAGE_LINK_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.+)$`, 'i')

/** Extract viewId from Draw.io internal page link for navigateTo round-trip. */
function navigateToFromLink(link: string | undefined): string | undefined {
  if (!link || link === '') return undefined
  const m = NAV_LINK_RE.exec(link)
  return m ? m[1]!.trim() : undefined
}

/**
 * Build one DrawioCell from mxCell attributes and inner content. Used for both standalone mxCell and UserObject-wrapped mxCell.
 */
const GEOM_TAG_RE = /<mxGeometry[^>]*>/i

/** Optional fields for DrawioCell (SOLID: single place for conditional spreads). */
function buildCellOptionalFields(params: {
  valueRaw: string | undefined
  parent: string | undefined
  source: string | undefined
  target: string | undefined
  style: string | undefined
  styleMap: Map<string, string>
  userData: { description?: string; technology?: string; customData?: string }
  geomStr: string
  fullTag: string
  vertex: boolean
  edge: boolean
  navigateTo: string | undefined
}): Partial<DrawioCell> {
  const { styleMap, userData, geomStr, fullTag, vertex, edge, navigateTo } = params
  const x = parseNum(getAttr(geomStr, 'x'))
  const y = parseNum(getAttr(geomStr, 'y'))
  const width = parseNum(getAttr(geomStr, 'width'))
  const height = parseNum(getAttr(geomStr, 'height'))
  const fillColor = styleMap.get('fillcolor')
  const strokeColor = styleMap.get('strokecolor')
  const description = userData.description ?? getDecodedStyle(styleMap, 'likec4description')
  const technology = userData.technology ?? getDecodedStyle(styleMap, 'likec4technology')
  const notes = getDecodedStyle(styleMap, 'likec4notes')
  const tags = getDecodedStyle(styleMap, 'likec4tags')
  const icon = getDecodedStyle(styleMap, 'likec4icon')
  const endArrow = styleMap.get('endarrow')
  const startArrow = styleMap.get('startarrow')
  const dashed = styleMap.get('dashed')
  const dashPattern = styleMap.get('dashpattern')
  const summary = getDecodedStyle(styleMap, 'likec4summary')
  const links = getDecodedStyle(styleMap, 'likec4links')
  const border = getDecodedStyle(styleMap, 'likec4border')
  const colorName = getDecodedStyle(styleMap, 'likec4colorname')
  const opacityFromStyle = styleMap.get('opacity')
  const opacityFromLikec4 = styleMap.get('likec4opacity')
  const opacityFromFill = styleMap.get('fillopacity')
  const opacity = (opacityFromLikec4 != null && opacityFromLikec4 !== '' ? opacityFromLikec4 : undefined) ??
    (opacityFromStyle != null && opacityFromStyle !== '' ? opacityFromStyle : undefined) ??
    (opacityFromFill != null && opacityFromFill !== '' ? opacityFromFill : undefined)
  const strokeWidthRaw = styleMap.get('strokewidth')
  const strokeWidth = strokeWidthRaw != null && strokeWidthRaw !== '' ? strokeWidthRaw : undefined
  const size = getDecodedStyle(styleMap, 'likec4size')
  const padding = getDecodedStyle(styleMap, 'likec4padding')
  const textSize = getDecodedStyle(styleMap, 'likec4textsize')
  const iconPosition = getDecodedStyle(styleMap, 'likec4iconposition')
  const link = getDecodedStyle(styleMap, 'link')
  const relationshipKind = getDecodedStyle(styleMap, 'likec4relationshipkind')
  const notation = getDecodedStyle(styleMap, 'likec4notation')
  const metadata = getDecodedStyle(styleMap, 'likec4metadata')
  const optional: Partial<DrawioCell> = {}
  if (params.valueRaw != null && params.valueRaw !== '') {
    optional.value = decodeXmlEntities(params.valueRaw)
  }
  if (params.parent != null && params.parent !== '') optional.parent = params.parent
  if (params.source != null && params.source !== '') optional.source = params.source
  if (params.target != null && params.target !== '') optional.target = params.target
  if (params.style != null && params.style !== '') optional.style = params.style
  if (x !== undefined) optional.x = x
  if (y !== undefined) optional.y = y
  if (width !== undefined) optional.width = width
  if (height !== undefined) optional.height = height
  if (fillColor !== undefined) optional.fillColor = fillColor
  if (strokeColor !== undefined) optional.strokeColor = strokeColor
  if (description != null) optional.description = description
  if (technology != null) optional.technology = technology
  if (notes != null) optional.notes = notes
  if (tags != null) optional.tags = tags
  if (navigateTo != null) optional.navigateTo = navigateTo
  if (icon != null) optional.icon = icon
  if (endArrow != null && endArrow !== '') optional.endArrow = endArrow
  if (startArrow != null && startArrow !== '') optional.startArrow = startArrow
  if (dashed != null && dashed !== '') optional.dashed = dashed
  if (dashPattern != null && dashPattern !== '') optional.dashPattern = dashPattern
  if (summary != null) optional.summary = summary
  if (links != null) optional.links = links
  if (link != null && vertex) optional.link = link
  if (border != null) optional.border = border
  if (strokeWidth != null && vertex) optional.strokeWidth = strokeWidth
  if (size != null && vertex) optional.size = size
  if (padding != null && vertex) optional.padding = padding
  if (textSize != null && vertex) optional.textSize = textSize
  if (iconPosition != null && vertex) optional.iconPosition = iconPosition
  if (colorName != null) optional.colorName = colorName
  if (opacity != null) optional.opacity = opacity
  if (relationshipKind != null) optional.relationshipKind = relationshipKind
  if (notation != null) optional.notation = notation
  if (metadata != null && edge) optional.metadata = metadata
  if (userData.customData != null) optional.customData = userData.customData
  if (edge) {
    const pts = parseEdgePoints(fullTag)
    if (pts != null) optional.edgePoints = pts
  }
  return optional
}

/**
 * Build one DrawioCell from parsed mxCell tag parts.
 * attrs: open-tag attribute string; inner: content between open/close; fullTag: full tag for geometry regex.
 * overrides: optional id/navigateTo to override parsed values. Returns null if id missing.
 */
function buildCellFromMxCell(
  attrs: string,
  inner: string,
  fullTag: string,
  overrides?: { id?: string; navigateTo?: string },
): DrawioCell | null {
  const id = overrides?.id ?? getAttr(attrs, 'id')
  if (!id) return null
  const vertex = getAttr(attrs, 'vertex') === '1'
  const edge = getAttr(attrs, 'edge') === '1'
  const style = getAttr(attrs, 'style')
  const geomMatch = GEOM_TAG_RE.exec(fullTag)
  const geomStr = geomMatch ? geomMatch[0] : ''
  const styleMap = parseStyle(style ?? undefined)
  const userData = parseUserData(inner)
  const navigateTo = overrides?.navigateTo ?? getDecodedStyle(styleMap, 'likec4navigateto')
  const optional = buildCellOptionalFields({
    valueRaw: getAttr(attrs, 'value'),
    parent: getAttr(attrs, 'parent'),
    source: getAttr(attrs, 'source'),
    target: getAttr(attrs, 'target'),
    style: getAttr(attrs, 'style'),
    styleMap,
    userData,
    geomStr,
    fullTag,
    vertex,
    edge,
    navigateTo,
  })
  return { id, vertex, edge, ...optional } as DrawioCell
}

/** Extract one mxCell from xml starting at tagStart. Returns attrs, inner, fullTag and next search index, or null. */
function extractOneMxCell(
  xml: string,
  tagStart: number,
): { attrs: string; inner: string; fullTag: string; next: number } | null {
  const endOpen = findOpenTagEnd(xml, tagStart)
  if (endOpen === -1) return null
  const attrs = xml.slice(tagStart + 7, endOpen).trim() // '<mxCell'.length === 7
  // Self-closing: <mxCell ... /> — the / is before >, so check the end of the open tag
  const tagEnd = xml.slice(Math.max(tagStart, endOpen - 10), endOpen).trimEnd()
  const isSelfClosing = tagEnd.endsWith('/')
  const afterBracket = endOpen + 1
  let inner: string
  let endTagPos: number
  if (isSelfClosing) {
    inner = ''
    endTagPos = endOpen
  } else {
    const closeStart = indexOfClosingTag(xml, 'mxCell', afterBracket)
    if (closeStart === -1) return null
    inner = xml.slice(afterBracket, closeStart)
    endTagPos = closeStart + '</mxCell>'.length - 1
  }
  const fullTag = xml.slice(tagStart, endTagPos + 1)
  return { attrs, inner, fullTag, next: endTagPos + 1 }
}

/**
 * Simple XML parser for DrawIO mxCell elements. Extracts cells with id, value, parent,
 * source, target, vertex, edge, geometry, style colors and LikeC4 user data.
 * Also parses <UserObject id="..." link="..."> wrapping mxCell (export format for navigateTo) so the inner mxCell gets id and navigateTo from the link.
 * Uses indexOf-based extraction instead of regex to avoid S5852 (super-linear backtracking DoS).
 */
function parseDrawioXml(xml: string): DrawioCell[] {
  const cells: DrawioCell[] = []
  const parsedIds = new Set<string>()
  const closeUserObjectLen = '</UserObject>'.length

  // First pass: UserObject with id and link (inner mxCell has no id; we build cell from UserObject + inner mxCell for round-trip)
  let uoStart = indexOfTagStart(xml, 'UserObject', 0)
  while (uoStart !== -1) {
    const endOpen = findOpenTagEnd(xml, uoStart)
    if (endOpen === -1) break
    const openTag = xml.slice(uoStart, endOpen + 1)
    const userObjId = getAttr(openTag, 'id')?.trim()
    const linkAttr = getAttr(openTag, 'link')
    const navigateTo = navigateToFromLink(linkAttr ?? undefined)
    const closeStart = indexOfClosingTag(xml, 'UserObject', endOpen + 1)
    if (closeStart === -1) break
    const innerXml = xml.slice(endOpen + 1, closeStart)

    if (userObjId) {
      const innerMxStart = indexOfTagStart(innerXml, 'mxCell', 0)
      if (innerMxStart !== -1) {
        const mx = extractOneMxCell(innerXml, innerMxStart)
        if (mx) {
          // Use innerXml (UserObject body) so parseUserData and fullTag see UserObject-level <data> siblings of the mxCell
          const fullTag = `<mxCell id="${userObjId}" ${mx.attrs}>${innerXml}</mxCell>`
          const cell = buildCellFromMxCell(
            mx.attrs,
            innerXml,
            fullTag,
            navigateTo != null && navigateTo !== '' ? { id: userObjId, navigateTo } : { id: userObjId },
          )
          if (cell) {
            cells.push(cell)
            parsedIds.add(cell.id)
          }
        }
      }
    }
    uoStart = indexOfTagStart(xml, 'UserObject', closeStart + closeUserObjectLen)
  }

  // Second pass: standalone mxCell (skip those already parsed as inner of UserObject)
  let mxStart = indexOfTagStart(xml, 'mxCell', 0)
  while (mxStart !== -1) {
    const mx = extractOneMxCell(xml, mxStart)
    if (mx) {
      const id = getAttr(mx.attrs, 'id')
      if (id && !parsedIds.has(id)) {
        const cell = buildCellFromMxCell(mx.attrs, mx.inner, mx.fullTag)
        if (cell) {
          cells.push(cell)
          parsedIds.add(cell.id)
        }
      }
      mxStart = indexOfTagStart(xml, 'mxCell', mx.next)
    } else {
      mxStart = indexOfTagStart(xml, 'mxCell', mxStart + 7)
    }
  }
  return cells
}

/** Map draw.io endArrow/startArrow style value to LikeC4 RelationshipArrowType. */
function likec4Arrow(drawioArrow: string | undefined): string | undefined {
  if (!drawioArrow || drawioArrow === '') return undefined
  const a = drawioArrow.toLowerCase()
  switch (a) {
    case 'none':
      return 'none'
    case 'block':
      return 'normal'
    case 'open':
      return 'open'
    case 'diamond':
      return 'diamond'
    case 'oval':
      return 'dot'
    default:
      return 'normal'
  }
}

/** Map draw.io dashed/dashPattern to LikeC4 line type. */
function likec4LineType(
  dashed: string | undefined,
  dashPattern: string | undefined,
): 'dashed' | 'dotted' | 'solid' | undefined {
  if (dashed === '1' || dashed === 'true') {
    const pattern = (dashPattern ?? '').trim()
    if (pattern === '1 1' || pattern === '2 2') return 'dotted'
    return 'dashed'
  }
  return undefined
}

/**
 * Infer LikeC4 element kind from DrawIO shape style. When parent is a container (container=1), child is component.
 * Explicit container=1 in style → system (context box); others default to container unless actor/swimlane.
 */
function inferKind(
  style: string | undefined,
  parentCell?: DrawioCell,
): 'actor' | 'system' | 'container' | 'component' {
  if (!style) return parentCell?.style?.toLowerCase().includes('container=1') ? 'component' : 'container'
  const s = style.toLowerCase()
  if (s.includes('umlactor') || s.includes('shape=person')) return 'actor'
  if (s.includes('swimlane')) return 'system'
  if (s.includes('container=1')) return 'system'
  if (parentCell?.style?.toLowerCase().includes('container=1')) return 'component'
  return 'container'
}

/** Infer LikeC4 shape from DrawIO style when possible (cylinder, document, etc.). */
function inferShape(style: string | undefined): string | undefined {
  if (!style) return undefined
  const s = style.toLowerCase()
  if (s.includes('shape=cylinder') || s.includes('cylinder3')) return 'cylinder'
  if (s.includes('shape=document')) return 'document'
  if (s.includes('shape=rectangle') && s.includes('rounded')) return 'rectangle'
  return undefined
}

/**
 * Sanitize a string for use as LikeC4 identifier (element name).
 */
function toId(name: string): string {
  return (
    name
      .trim()
      .replaceAll(/\s+/g, '_')
      .replaceAll(/[^\w-]/g, '')
      .replace(/^[0-9]/, '_$&') || 'element'
  )
}

/** Returns a unique name generator that avoids collisions by appending _1, _2, ... (DRY: used in parseDrawioToLikeC4 and buildDiagramState). */
function makeUniqueName(usedNames: Set<string>): (base: string) => string {
  return (base: string) => {
    let name = toId(base || 'element')
    let n = name
    let i = 0
    while (usedNames.has(n)) n = `${name}_${++i}`
    usedNames.add(n)
    return n
  }
}

/** Assign FQNs to element vertices: root first, then hierarchy by parent, then orphans (DRY). */
function assignFqnsToElementVertices(
  idToFqn: Map<string, string>,
  elementVertices: DrawioCell[],
  containerIdToTitle: Map<string, string>,
  isRootParent: (parent: string | undefined) => boolean,
  uniqueName: (base: string) => string,
): void {
  const baseName = (v: DrawioCell) => v.value ?? containerIdToTitle.get(v.id) ?? v.id
  for (const v of elementVertices) {
    if (isRootParent(v.parent)) idToFqn.set(v.id, uniqueName(baseName(v)))
  }
  let changed = true
  while (changed) {
    changed = false
    for (const v of elementVertices) {
      if (idToFqn.has(v.id)) continue
      const parent = v.parent ? idToFqn.get(v.parent) : null
      if (parent != null) {
        idToFqn.set(v.id, `${parent}.${uniqueName(baseName(v))}`)
        changed = true
      }
    }
  }
  for (const v of elementVertices) {
    if (!idToFqn.has(v.id)) idToFqn.set(v.id, uniqueName(baseName(v)))
  }
}

/** Build map of hex color -> custom name from vertices and edges for specification customColors (DRY). */
function buildHexToCustomName(
  elementVertices: DrawioCell[],
  edges: DrawioCell[],
): Map<string, string> {
  const hexToCustomName = new Map<string, string>()
  let customColorIndex = 0
  for (const v of elementVertices) {
    const fill = v.fillColor?.trim()
    if (fill && /^#[0-9A-Fa-f]{3,8}$/.test(fill)) {
      if (v.colorName?.trim()) {
        const name = v.colorName.trim().replaceAll(/\s+/g, '_')
        if (!hexToCustomName.has(fill)) hexToCustomName.set(fill, name)
      } else if (!hexToCustomName.has(fill)) {
        hexToCustomName.set(fill, `drawio_color_${++customColorIndex}`)
      }
    }
  }
  let edgeColorIndex = 0
  for (const e of edges) {
    const stroke = e.strokeColor?.trim()
    if (stroke && /^#[0-9A-Fa-f]{3,8}$/.test(stroke) && !hexToCustomName.has(stroke)) {
      hexToCustomName.set(stroke, `drawio_edge_color_${++edgeColorIndex}`)
    }
  }
  return hexToCustomName
}

/** Detect container cells and their title cells (text shape inside/near container); returns maps for FQN resolution (DRY). */
function computeContainerTitles(vertices: DrawioCell[]): {
  containerIdToTitle: Map<string, string>
  titleCellIds: Set<string>
} {
  const containerIdToTitle = new Map<string, string>()
  const titleCellIds = new Set<string>()
  const containerCells = vertices.filter(
    v =>
      v.style?.toLowerCase().includes('container=1') &&
      v.x != null &&
      v.y != null &&
      v.width != null &&
      v.height != null,
  )
  for (const cont of containerCells) {
    const cx = cont.x!,
      cy = cont.y!,
      cw = cont.width!,
      ch = cont.height!
    const titleAreaHeight = Math.min(CONTAINER_TITLE_AREA_MAX_HEIGHT_PX, ch * CONTAINER_TITLE_AREA_HEIGHT_RATIO) +
      CONTAINER_TITLE_AREA_TOLERANCE
    const best = vertices.find(
      v =>
        v.id !== cont.id &&
        v.parent === cont.parent &&
        (v.style?.toLowerCase().includes('shape=text') || v.style?.toLowerCase().includes('text;')) &&
        v.x != null &&
        v.y != null &&
        v.x >= cx - CONTAINER_TITLE_AREA_TOLERANCE &&
        v.x <= cx + cw + CONTAINER_TITLE_AREA_TOLERANCE &&
        v.y >= cy - CONTAINER_TITLE_AREA_TOLERANCE &&
        v.y <= cy + titleAreaHeight,
    )
    if (best) {
      const raw = (best.value ?? '').trim()
      if (raw) {
        containerIdToTitle.set(cont.id, stripHtml(raw))
        titleCellIds.add(best.id)
      }
    }
  }
  return { containerIdToTitle, titleCellIds }
}

/** Strip XML/HTML tags without regex to avoid S5852 (super-linear backtracking). */
function stripTags(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    const open = s.indexOf('<', i)
    if (open === -1) {
      out += s.slice(i)
      break
    }
    out += s.slice(i, open)
    const close = s.indexOf('>', open)
    if (close === -1) {
      out += '<'
      i = open + 1
    } else {
      i = close + 1
    }
  }
  return out
}

/** Decode XML entities, take first line up to <br, strip tags. Single implementation for cell value and title (DRY). */
function stripHtml(raw: string | undefined): string {
  if (!raw || raw.trim() === '') return ''
  const decoded = raw
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
  const firstLine = decoded.split('\n')[0] ?? ''
  const brIdx = firstLine.toLowerCase().indexOf('<br')
  const segment = brIdx === -1 ? firstLine : firstLine.slice(0, brIdx)
  return stripTags(segment).trim() || ''
}

/** Escape single quotes for LikeC4 string literals (DRY). */
function escapeLikec4Quotes(s: string): string {
  return s.replaceAll('\'', '\'\'')
}

/** Decode optional root cell style field (likec4ViewTitle, likec4ViewDescription, etc.). */
function decodeRootStyleField(raw: string | undefined): string {
  return raw != null && raw !== '' ? decodeURIComponent(raw) : ''
}

/** Build view block lines for model (single responsibility; DRY with parseDrawioToLikeC4). */
function buildViewBlockLines(viewId: string, viewTitle: string, viewDesc: string): string[] {
  return [
    'views {',
    `  view ${viewId} {`,
    ...(viewTitle ? [`    title '${escapeLikec4Quotes(viewTitle)}'`] : []),
    ...(viewDesc ? [`    description '${escapeLikec4Quotes(viewDesc)}'`] : []),
    '    include *',
    '  }',
    '}',
    '',
  ]
}

/** Push element declaration line: name = actor|system|container 'title'. */
function pushElementHeader(
  ctx: ElementEmitContext,
  pad: string,
  name: string,
  kind: 'actor' | 'system' | 'container' | 'component',
  title: string,
): void {
  const escaped = escapeLikec4Quotes(title)
  switch (kind) {
    case 'actor':
      ctx.lines.push(`${pad}${name} = actor '${escaped}'`)
      break
    case 'system':
      ctx.lines.push(`${pad}${name} = system '${escaped}'`)
      break
    case 'container':
    case 'component':
    default:
      ctx.lines.push(`${pad}${name} = container '${escaped}'`)
  }
}

/** Push style { ... } block for element when any style part is present. */
function pushElementStyleBlock(
  ctx: ElementEmitContext,
  pad: string,
  cell: DrawioCell,
  colorName: string | undefined,
): void {
  const border = cell.border?.trim()
  const opacityVal = cell.opacity
  const shapeOverride = inferShape(cell.style)
  const sizeVal = cell.size?.trim()
  const paddingVal = cell.padding?.trim()
  const textSizeVal = cell.textSize?.trim()
  const iconPositionVal = cell.iconPosition?.trim()
  if (
    !colorName &&
    !(border && ['solid', 'dashed', 'dotted', 'none'].includes(border)) &&
    !(opacityVal && /^\d+$/.test(opacityVal)) &&
    !shapeOverride &&
    !sizeVal &&
    !paddingVal &&
    !textSizeVal &&
    !iconPositionVal
  ) {
    return
  }
  const styleParts: string[] = []
  if (colorName) styleParts.push(`color ${colorName}`)
  if (border && ['solid', 'dashed', 'dotted', 'none'].includes(border)) {
    styleParts.push(`border ${border}`)
  }
  if (opacityVal && /^\d+$/.test(opacityVal)) styleParts.push(`opacity ${opacityVal}`)
  if (shapeOverride) styleParts.push(`shape ${shapeOverride}`)
  if (sizeVal) styleParts.push(`size ${sizeVal}`)
  if (paddingVal) styleParts.push(`padding ${paddingVal}`)
  if (textSizeVal) styleParts.push(`textSize ${textSizeVal}`)
  if (iconPositionVal) styleParts.push(`iconPosition ${iconPositionVal}`)
  if (styleParts.length > 0) ctx.lines.push(`${pad}  style { ${styleParts.join(', ')} }`)
}

/** Format link lines for .c4 (DRY: elements and edges). Returns lines with given prefix. */
function formatLinkLines(
  linksJson: string | undefined,
  nativeLink: string | undefined,
  linePrefix: string,
): string[] {
  const out: string[] = []
  try {
    const linksArr = linksJson ? (JSON.parse(linksJson) as { url: string; title?: string }[]) : null
    if (Array.isArray(linksArr)) {
      for (const link of linksArr) {
        if (link?.url) {
          out.push(
            `${linePrefix}link '${escapeLikec4Quotes(String(link.url))}'${
              link.title ? ` '${escapeLikec4Quotes(String(link.title))}'` : ''
            }`,
          )
        }
      }
    }
    if (out.length === 0 && nativeLink) {
      out.push(`${linePrefix}link '${escapeLikec4Quotes(nativeLink)}'`)
    }
  } catch {
    if (nativeLink) out.push(`${linePrefix}link '${escapeLikec4Quotes(nativeLink)}'`)
  }
  return out
}

/** Push link line(s) from linksJson or nativeLink (DRY with emitEdgesToLines). */
function pushElementLinks(
  ctx: ElementEmitContext,
  pad: string,
  linksJson: string | undefined,
  nativeLink: string | undefined,
): void {
  const prefix = `${pad}  `
  for (const line of formatLinkLines(linksJson, nativeLink, prefix)) {
    ctx.lines.push(line)
  }
}

/** Context for emitting element/edge lines (shared by single and multi diagram paths). */
interface ElementEmitContext {
  lines: string[]
  idToCell: Map<string, DrawioCell>
  containerIdToTitle: Map<string, string>
  children: Map<string, Array<{ cellId: string; fqn: string }>>
  hexToCustomName: Map<string, string>
  byId: Map<string, DrawioCell>
}

/** Whether element has any body content (Clean Code: single place for hasBody condition). */
function elementHasBody(
  cell: DrawioCell,
  childList: Array<{ cellId: string; fqn: string }> | undefined,
  colorName: string | undefined,
  opts: {
    desc: string | undefined
    tech: string | undefined
    notes: string | undefined
    summary: string | undefined
    linksJson: string | undefined
    nativeLink: string | undefined
    notation: string | undefined
    tagList: string[]
    navigateTo: string | undefined
    icon: string | undefined
  },
): boolean {
  return (
    (childList?.length ?? 0) > 0 ||
    !!opts.desc ||
    !!opts.tech ||
    !!opts.notes ||
    !!opts.summary ||
    !!opts.linksJson ||
    !!opts.nativeLink ||
    !!opts.notation ||
    opts.tagList.length > 0 ||
    !!colorName ||
    !!cell.border?.trim() ||
    !!cell.opacity ||
    !!inferShape(cell.style) ||
    !!cell.size ||
    !!cell.padding ||
    !!cell.textSize ||
    !!cell.iconPosition ||
    !!opts.navigateTo ||
    !!opts.icon
  )
}

/** Push element body lines (style, tags, description, links, children). */
function pushElementBody(
  ctx: ElementEmitContext,
  pad: string,
  cell: DrawioCell,
  childList: Array<{ cellId: string; fqn: string }> | undefined,
  fqn: string,
  indent: number,
  colorName: string | undefined,
  opts: {
    desc: string | undefined
    tech: string | undefined
    notes: string | undefined
    summary: string | undefined
    linksJson: string | undefined
    nativeLink: string | undefined
    notation: string | undefined
    tagList: string[]
    navigateTo: string | undefined
    icon: string | undefined
  },
): void {
  ctx.lines.push(`${pad}{`)
  pushElementStyleBlock(ctx, pad, cell, colorName)
  for (const t of opts.tagList) ctx.lines.push(`${pad}  #${t.replaceAll(/\s+/g, '_')}`)
  if (opts.desc) ctx.lines.push(`${pad}  description '${escapeLikec4Quotes(opts.desc)}'`)
  if (opts.tech) ctx.lines.push(`${pad}  technology '${escapeLikec4Quotes(opts.tech)}'`)
  if (opts.summary) ctx.lines.push(`${pad}  summary '${escapeLikec4Quotes(opts.summary)}'`)
  if (opts.notes) ctx.lines.push(`${pad}  notes '${escapeLikec4Quotes(opts.notes)}'`)
  if (opts.notation) ctx.lines.push(`${pad}  notation '${escapeLikec4Quotes(opts.notation)}'`)
  pushElementLinks(ctx, pad, opts.linksJson, opts.nativeLink)
  if (opts.navigateTo) ctx.lines.push(`${pad}  navigateTo ${opts.navigateTo}`)
  if (opts.icon) ctx.lines.push(`${pad}  icon '${escapeLikec4Quotes(opts.icon)}'`)
  if (childList && childList.length > 0) {
    for (const ch of childList) {
      emitElement.toLines(ctx, ch.cellId, ch.fqn, indent + 1)
    }
  }
  ctx.lines.push(`${pad}}`)
}

function emitElementToLines(ctx: ElementEmitContext, cellId: string, fqn: string, indent: number): void {
  const cell = ctx.idToCell.get(cellId)
  if (!cell) return
  const parentCell = cell.parent ? ctx.byId.get(cell.parent) : undefined
  const kind = inferKind(cell.style, parentCell)
  const rawTitle = (cell.value && cell.value.trim()) || ''
  const title = stripHtml(rawTitle) ||
    (ctx.containerIdToTitle.get(cell.id) ?? ctx.containerIdToTitle.get(cellId) ?? '') ||
    fqn.split('.').pop() ||
    'Element'
  const name = fqn.split('.').pop()!
  const pad = '  '.repeat(indent)
  const desc = cell.description?.trim()
  const tech = cell.technology?.trim()
  const notes = cell.notes?.trim()
  const tagsStr = cell.tags?.trim()
  const tagList = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
  const navigateTo = cell.navigateTo?.trim()
  const icon = cell.icon?.trim()
  const summary = cell.summary?.trim()
  const linksJson = cell.links?.trim()
  const nativeLink = cell.link?.trim()
  const notation = cell.notation?.trim()
  const colorName = cell.fillColor && /^#[0-9A-Fa-f]{3,8}$/.test(cell.fillColor.trim())
    ? ctx.hexToCustomName.get(cell.fillColor.trim())
    : undefined
  const childList = ctx.children.get(fqn)
  const opts = {
    desc,
    tech,
    notes,
    summary,
    linksJson,
    nativeLink,
    notation,
    tagList,
    navigateTo,
    icon,
  }
  const hasBody = elementHasBody(cell, childList, colorName, opts)

  pushElementHeader(ctx, pad, name, kind, title)

  if (hasBody) {
    pushElementBody(ctx, pad, cell, childList, fqn, indent, colorName, opts)
  } else {
    ctx.lines.push(`${pad}{`)
    ctx.lines.push(`${pad}}`)
  }
  ctx.lines.push('')
}

/** Group element-emit helpers for navigation (header, styleBlock, links, body, toLines). */
const emitElement = {
  toLines: emitElementToLines,
}

type EdgeEntry = { cell: DrawioCell; src: string; tgt: string }

function emitEdgesToLines(
  lines: string[],
  edgeEntries: EdgeEntry[],
  hexToCustomName: Map<string, string>,
): void {
  for (const { cell: e, src, tgt } of edgeEntries) {
    const title = (e.value && e.value.trim()) ? escapeLikec4Quotes(e.value.trim()) : ''
    const desc = e.description?.trim()
    const tech = e.technology?.trim()
    const notes = e.notes?.trim()
    const navTo = e.navigateTo?.trim()
    const head = likec4Arrow(e.endArrow)
    const tail = likec4Arrow(e.startArrow)
    const line = likec4LineType(e.dashed, e.dashPattern)
    const relKind = e.relationshipKind?.trim()
    const notation = e.notation?.trim()
    const linksJson = e.links?.trim()
    const metadataJson = e.metadata?.trim()
    const edgeStrokeHex = e.strokeColor?.trim()
    const hasBody = !!notes || !!navTo || !!head || !!tail || !!line || !!notation || !!linksJson ||
      !!metadataJson || !!edgeStrokeHex
    const arrowPart = relKind && /^[a-zA-Z0-9_-]+$/.test(relKind) ? ` -[${relKind}]-> ` : ' -> '
    const titlePart = title ? ` '${title}'` : desc || tech ? ` ''` : ''
    const descPart = desc ? ` '${escapeLikec4Quotes(desc)}'` : ''
    const techPart = tech ? ` '${escapeLikec4Quotes(tech)}'` : ''
    const relationHead = `  ${src}${arrowPart}${tgt}${titlePart}${descPart}${techPart}`
    if (hasBody) {
      const bodyLines: string[] = []
      if (notes) bodyLines.push(`    notes '${escapeLikec4Quotes(notes)}'`)
      if (navTo) bodyLines.push(`    navigateTo ${navTo}`)
      if (notation) bodyLines.push(`    notation '${escapeLikec4Quotes(notation)}'`)
      for (const line of formatLinkLines(linksJson, undefined, '    ')) {
        bodyLines.push(line)
      }
      try {
        const metaObj = metadataJson ? (JSON.parse(metadataJson) as Record<string, string | string[]>) : null
        if (metaObj && typeof metaObj === 'object' && !Array.isArray(metaObj)) {
          const metaAttrs: string[] = []
          for (const [k, v] of Object.entries(metaObj)) {
            if (k.trim() === '') continue
            const safeKey = /^[a-zA-Z_]\w*$/.test(k) ? k : `'${escapeLikec4Quotes(k)}'`
            if (Array.isArray(v)) {
              const arrVals = v.map(s => `'${escapeLikec4Quotes(String(s))}'`)
              metaAttrs.push(` ${safeKey} [ ${arrVals.join(', ')} ];`)
            } else if (v != null && typeof v === 'string') {
              metaAttrs.push(` ${safeKey} '${escapeLikec4Quotes(v)}';`)
            }
          }
          if (metaAttrs.length > 0) {
            bodyLines.push('    metadata {' + metaAttrs.join('') + ' }')
          }
        }
      } catch {
        // ignore invalid JSON
      }
      if (head || tail || line || edgeStrokeHex) {
        const parts: string[] = []
        if (line) parts.push(`line ${line}`)
        if (head) parts.push(`head ${head}`)
        if (tail) parts.push(`tail ${tail}`)
        if (edgeStrokeHex && /^#[0-9A-Fa-f]{3,8}$/.test(edgeStrokeHex)) {
          const edgeColorName = hexToCustomName.get(edgeStrokeHex)
          if (edgeColorName) parts.push(`color ${edgeColorName}`)
        }
        if (parts.length > 0) bodyLines.push(`    style { ${parts.join(', ')} }`)
      }
      lines.push(relationHead + ' {', ...bodyLines, '  }')
    } else {
      lines.push(relationHead)
    }
  }
}

/** Collect layout, stroke, customData and waypoint lines for one diagram state (shared by single and multi emit). */
function collectRoundtripForState(
  viewId: string,
  idToFqn: Map<string, string>,
  byId: Map<string, DrawioCell>,
  edges: DrawioCell[],
): {
  layoutNodes: Record<string, { x: number; y: number; width: number; height: number }>
  strokeColorLines: string[]
  strokeWidthLines: string[]
  customDataLines: string[]
  waypointLines: string[]
} {
  const layoutNodes: Record<string, { x: number; y: number; width: number; height: number }> = {}
  for (const [cellId, fqn] of idToFqn) {
    const cell = byId.get(cellId)
    if (
      cell?.vertex &&
      cell.x != null &&
      cell.y != null &&
      cell.width != null &&
      cell.height != null
    ) {
      layoutNodes[fqn] = { x: cell.x, y: cell.y, width: cell.width, height: cell.height }
    }
  }
  const strokeColorLines: string[] = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = byId.get(cellId)
    if (
      cell?.vertex &&
      cell.strokeColor?.trim() &&
      /^#[0-9A-Fa-f]{3,8}$/.test(cell.strokeColor.trim())
    ) {
      strokeColorLines.push(`// ${fqn}=${cell.strokeColor.trim()}`)
    }
  }
  const strokeWidthLines: string[] = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = byId.get(cellId)
    if (cell?.vertex && cell.strokeWidth != null && cell.strokeWidth.trim() !== '') {
      strokeWidthLines.push(`// ${fqn}=${cell.strokeWidth.trim()}`)
    }
  }
  const customDataLines: string[] = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = byId.get(cellId)
    if (cell?.customData?.trim()) customDataLines.push(`// ${fqn} ${cell.customData.trim()}`)
  }
  const edgesWithEndpoints = edges.filter(isEdgeWithEndpoints)
  for (const e of edgesWithEndpoints) {
    const src = idToFqn.get(e.source)
    const tgt = idToFqn.get(e.target)
    if (src && tgt && e.customData?.trim()) {
      customDataLines.push(`// ${src}|${tgt} ${e.customData.trim()}`)
    }
  }
  const waypointLines: string[] = []
  for (const e of edgesWithEndpoints) {
    const src = idToFqn.get(e.source)
    const tgt = idToFqn.get(e.target)
    if (src && tgt && e.edgePoints?.trim()) {
      waypointLines.push(`// ${src}|${tgt}|${e.id} ${e.edgePoints.trim()}`)
    }
  }
  return { layoutNodes, strokeColorLines, strokeWidthLines, customDataLines, waypointLines }
}

function emitRoundtripCommentsSingle(
  lines: string[],
  viewId: string,
  idToFqn: Map<string, string>,
  byId: Map<string, DrawioCell>,
  edges: DrawioCell[],
): void {
  const r = collectRoundtripForState(viewId, idToFqn, byId, edges)
  if (Object.keys(r.layoutNodes).length > 0) {
    lines.push(
      '// <likec4.layout.drawio>',
      '// ' + JSON.stringify({ [viewId]: { nodes: r.layoutNodes } }),
      '// </likec4.layout.drawio>',
    )
  }
  if (r.strokeColorLines.length > 0) {
    lines.push('// <likec4.strokeColor.vertices>', ...r.strokeColorLines, '// </likec4.strokeColor.vertices>')
  }
  if (r.strokeWidthLines.length > 0) {
    lines.push('// <likec4.strokeWidth.vertices>', ...r.strokeWidthLines, '// </likec4.strokeWidth.vertices>')
  }
  if (r.customDataLines.length > 0) {
    lines.push('// <likec4.customData>', ...r.customDataLines, '// </likec4.customData>')
  }
  if (r.waypointLines.length > 0) {
    lines.push('// <likec4.edge.waypoints>', ...r.waypointLines, '// </likec4.edge.waypoints>')
  }
}

/** Per-diagram state for multi round-trip comments (viewId + idToFqn/idToCell/edges). */
interface DiagramStateForRoundtrip {
  viewId: string
  idToFqn: Map<string, string>
  idToCell: Map<string, DrawioCell>
  edges: DrawioCell[]
}

function emitRoundtripCommentsMulti(
  lines: string[],
  states: DiagramStateForRoundtrip[],
): void {
  const layoutByView: Record<
    string,
    { nodes: Record<string, { x: number; y: number; width: number; height: number }> }
  > = {}
  const strokeColorLines: string[] = []
  const strokeWidthLines: string[] = []
  const customDataLines: string[] = []
  const waypointLines: string[] = []
  for (const st of states) {
    const r = collectRoundtripForState(st.viewId, st.idToFqn, st.idToCell, st.edges)
    layoutByView[st.viewId] = { nodes: r.layoutNodes }
    strokeColorLines.push(...r.strokeColorLines)
    strokeWidthLines.push(...r.strokeWidthLines)
    customDataLines.push(...r.customDataLines)
    waypointLines.push(...r.waypointLines)
  }
  const hasLayout = Object.values(layoutByView).some(
    v => v != null && Object.keys(v.nodes).length > 0,
  )
  if (hasLayout) {
    lines.push(
      '// <likec4.layout.drawio>',
      '// ' + JSON.stringify(layoutByView),
      '// </likec4.layout.drawio>',
    )
  }
  if (strokeColorLines.length > 0) {
    lines.push('// <likec4.strokeColor.vertices>', ...strokeColorLines, '// </likec4.strokeColor.vertices>')
  }
  if (strokeWidthLines.length > 0) {
    lines.push('// <likec4.strokeWidth.vertices>', ...strokeWidthLines, '// </likec4.strokeWidth.vertices>')
  }
  if (customDataLines.length > 0) {
    lines.push('// <likec4.customData>', ...customDataLines, '// </likec4.customData>')
  }
  if (waypointLines.length > 0) {
    lines.push('// <likec4.edge.waypoints>', ...waypointLines, '// </likec4.edge.waypoints>')
  }
}

/** Decompress draw.io diagram content: base64 → inflateRaw → decodeURIComponent. Exported for tests (error message contract). */
export function decompressDrawioDiagram(base64Content: string): string {
  const trimmed = base64Content.trim()
  let bytes: Uint8Array
  try {
    if (typeof Buffer !== 'undefined') {
      bytes = new Uint8Array(Buffer.from(trimmed, 'base64'))
    } else {
      const binary = atob(trimmed)
      bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = (binary.codePointAt(i) ?? 0) & 0xff
    }
  } catch (err) {
    throw new Error(`DrawIO diagram decompression failed (base64 decode): ${toErrorMessage(err)}`)
  }
  let inflated: string
  try {
    inflated = pako.inflateRaw(bytes, { to: 'string' })
  } catch (err) {
    throw new Error(`DrawIO diagram decompression failed (inflate): ${toErrorMessage(err)}`)
  }
  try {
    return decodeURIComponent(inflated)
  } catch (err) {
    throw new Error(`DrawIO diagram decompression failed (URI decode): ${toErrorMessage(err)}`)
  }
}

export interface DiagramInfo {
  name: string
  id: string
  content: string
}

/**
 * Extract first diagram name, id and content from mxfile. Handles compressed (base64+deflate) and uncompressed content.
 */
function getFirstDiagram(fullXml: string): DiagramInfo {
  const all = getAllDiagrams(fullXml)
  return all[0] ?? { name: 'index', id: `${DRAWIO_DIAGRAM_ID_PREFIX}index`, content: '' }
}

/** Length of '<diagram' open tag for slice offset in getAllDiagrams (indexOf-based to avoid regex DoS S5852). */
const DIAGRAM_TAG_OPEN_LEN = '<diagram'.length

/**
 * Extract all diagram name, id and content from mxfile (for multi-tab .drawio).
 * Uses indexOf-based extraction instead of regex to avoid S5852 (super-linear backtracking DoS).
 */
export function getAllDiagrams(fullXml: string): DiagramInfo[] {
  const results: DiagramInfo[] = []
  const closeDiagramLen = '</diagram>'.length
  let start = indexOfTagStart(fullXml, 'diagram', 0)
  while (start !== -1) {
    const endOpen = findOpenTagEnd(fullXml, start)
    if (endOpen === -1) break
    const attrs = fullXml.slice(start + DIAGRAM_TAG_OPEN_LEN, endOpen).trim()
    const closeStart = indexOfClosingTag(fullXml, 'diagram', endOpen + 1)
    if (closeStart === -1) break
    const inner = fullXml.slice(endOpen + 1, closeStart)

    const name = getAttr(attrs, 'name') ?? (results.length === 0 ? 'index' : `diagram_${results.length + 1}`)
    const id = getAttr(attrs, 'id') ?? `${DRAWIO_DIAGRAM_ID_PREFIX}${name}`
    let content: string
    if (inner.includes('<mxGraphModel')) content = inner
    else if (inner.trim() === '') content = inner
    else {
      try {
        content = decompressDrawioDiagram(inner)
      } catch {
        content = inner
      }
    }
    results.push({ name, id, content })
    start = indexOfTagStart(fullXml, 'diagram', closeStart + closeDiagramLen)
  }
  return results
}

/** Split parsed cells into vertices and edges (single responsibility). */
function verticesAndEdgesFromCells(cells: DrawioCell[]): {
  vertices: DrawioCell[]
  edges: DrawioCell[]
} {
  const vertices = cells.filter(c => c.vertex && c.id !== '0' && c.id !== '1')
  const edges = cells.filter(c => c.edge && c.source && c.target)
  return { vertices, edges }
}

/** Common diagram state built from parsed cells (shared by single- and multi-diagram flows). */
type CommonDiagramStateFromCells = DiagramState & { byId: Map<string, DrawioCell> }

/** Build common diagram state from cells and diagram name (byId, FQN/hierarchy, view fields from root). */
function buildCommonDiagramStateFromCells(
  cells: DrawioCell[],
  diagramName: string,
): CommonDiagramStateFromCells {
  const byId = new Map<string, DrawioCell>()
  for (const c of cells) byId.set(c.id, c)
  const { vertices, edges } = verticesAndEdgesFromCells(cells)
  const rootIds = new Set(['0', '1'])
  const isRootParent = (p: string | undefined) => !p || rootIds.has(p)
  const idToFqn = new Map<string, string>()
  const idToCell = new Map<string, DrawioCell>()
  for (const v of vertices) idToCell.set(v.id, v)
  const { containerIdToTitle, titleCellIds } = computeContainerTitles(vertices)
  const elementVertices = vertices.filter(v => !titleCellIds.has(v.id))
  const usedNames = new Set<string>()
  const uniqueName = makeUniqueName(usedNames)
  assignFqnsToElementVertices(idToFqn, elementVertices, containerIdToTitle, isRootParent, uniqueName)
  const hexToCustomName = buildHexToCustomName(elementVertices, edges)
  const children = new Map<string, Array<{ cellId: string; fqn: string }>>()
  const roots: Array<{ cellId: string; fqn: string }> = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = idToCell.get(cellId)
    if (cell) {
      if (isRootParent(cell.parent)) {
        roots.push({ cellId, fqn })
      } else {
        const parentFqn = cell.parent != null ? idToFqn.get(cell.parent) : undefined
        if (parentFqn != null) {
          const list = children.get(parentFqn) ?? []
          list.push({ cellId, fqn })
          children.set(parentFqn, list)
        } else {
          roots.push({ cellId, fqn })
        }
      }
    }
  }
  const viewId = toId(diagramName) || 'index'
  const rootCell = byId.get('1')
  const rootStyle = rootCell?.style ? parseStyle(rootCell.style) : new Map<string, string>()
  const viewTitle = decodeRootStyleField(rootStyle.get('likec4viewtitle'))
  const viewDesc = decodeRootStyleField(rootStyle.get('likec4viewdescription'))
  const viewNotation = decodeRootStyleField(rootStyle.get('likec4viewnotation'))
  return {
    idToFqn,
    idToCell,
    containerIdToTitle,
    roots,
    children,
    hexToCustomName,
    edges,
    viewId,
    viewTitle,
    viewDesc,
    viewNotation,
    byId,
  }
}

/** Build single-diagram state from cells and diagram name (orchestrator: common state + lines buffer). */
function buildSingleDiagramState(cells: DrawioCell[], diagramName: string): SingleDiagramState {
  const common = buildCommonDiagramStateFromCells(cells, diagramName)
  const { hexToCustomName } = common
  const lines: string[] = []
  if (hexToCustomName.size > 0) {
    lines.push('specification {')
    for (const [hex, name] of hexToCustomName) lines.push(`  color ${name} ${hex}`)
    lines.push('}', '')
  }
  lines.push('model {', '')
  return {
    ...common,
    lines,
  }
}

/** Emit LikeC4 source from single-diagram state (orchestrator: elements + edges + view + roundtrip). */
function emitLikeC4SourceFromSingleState(state: SingleDiagramState): string {
  const { lines, idToCell, containerIdToTitle, children, hexToCustomName, byId } = state
  const emitCtx: ElementEmitContext = {
    lines,
    idToCell,
    containerIdToTitle,
    children,
    hexToCustomName,
    byId,
  }
  for (const { cellId, fqn } of state.roots) {
    emitElement.toLines(emitCtx, cellId, fqn, 1)
  }
  const edgeEntries: EdgeEntry[] = []
  for (const e of state.edges.filter(isEdgeWithEndpoints)) {
    const src = state.idToFqn.get(e.source)
    const tgt = state.idToFqn.get(e.target)
    if (src && tgt) edgeEntries.push({ cell: e, src, tgt })
  }
  emitEdgesToLines(lines, edgeEntries, hexToCustomName)
  lines.push('}', '')
  lines.push(...buildViewBlockLines(state.viewId, state.viewTitle, state.viewDesc))
  if (state.viewNotation) {
    lines.push(`// likec4.view.notation ${state.viewId} '${escapeLikec4Quotes(state.viewNotation)}'`)
  }
  emitRoundtripCommentsSingle(lines, state.viewId, state.idToFqn, byId, state.edges)
  return lines.join('\n')
}

/**
 * Convert DrawIO XML to LikeC4 source (.c4) string.
 * - Vertices become model elements (actor/container); hierarchy from parent refs.
 * - Edges become relations (->).
 * - Root diagram cells (parent "1") are top-level; others are nested by parent.
 * - Uses first diagram only; diagram name becomes view id; root cell style likec4ViewTitle/likec4ViewDescription become view title/description.
 */
export function parseDrawioToLikeC4(xml: string): string {
  const { name: diagramName, content: xmlToParse } = getFirstDiagram(xml)
  const cells = parseDrawioXml(xmlToParse)
  const state = buildSingleDiagramState(cells, diagramName)
  return emitLikeC4SourceFromSingleState(state)
}

/** Per-diagram state for merging multiple diagrams. */
interface DiagramState {
  idToFqn: Map<string, string>
  idToCell: Map<string, DrawioCell>
  containerIdToTitle: Map<string, string>
  roots: Array<{ cellId: string; fqn: string }>
  children: Map<string, Array<{ cellId: string; fqn: string }>>
  hexToCustomName: Map<string, string>
  edges: DrawioCell[]
  viewId: string
  viewTitle: string
  viewDesc: string
  viewNotation: string
}

/** Single-diagram state including lines buffer and byId for emit (parse → cells → state → emit). */
type SingleDiagramState = DiagramState & {
  lines: string[]
  byId: Map<string, DrawioCell>
}

function buildDiagramState(content: string, diagramName: string): DiagramState | null {
  const cells = parseDrawioXml(content)
  const common = buildCommonDiagramStateFromCells(cells, diagramName)
  const { byId: _byId, ...diagramState } = common
  return diagramState
}

type ViewInfo = {
  viewId: string
  viewTitle: string
  viewDesc: string
  viewNotation: string
  fqnSet: Set<string>
}

type MergedMultiState = {
  fqnToCell: Map<string, DrawioCell>
  byId: Map<string, DrawioCell>
  containerIdToTitle: Map<string, string>
  relationKeyToEdge: Map<string, { src: string; tgt: string; cell: DrawioCell }>
  hexToCustomName: Map<string, string>
  viewInfos: ViewInfo[]
}

/** Merge multiple diagram states into shared maps and view infos (single responsibility). */
function mergeDiagramStatesIntoMaps(states: DiagramState[]): MergedMultiState {
  const fqnToCell = new Map<string, DrawioCell>()
  const byId = new Map<string, DrawioCell>()
  const containerIdToTitle = new Map<string, string>()
  const relationKeyToEdge = new Map<string, { src: string; tgt: string; cell: DrawioCell }>()
  const hexToCustomName = new Map<string, string>()
  const viewInfos: ViewInfo[] = []

  for (const st of states) {
    for (const [cellId, fqn] of st.idToFqn) {
      const cell = st.idToCell.get(cellId)
      if (cell && !fqnToCell.has(fqn)) fqnToCell.set(fqn, cell)
    }
    for (const [id, cell] of st.idToCell) {
      if (byId.has(id)) continue
      byId.set(id, cell)
    }
    for (const [id, title] of st.containerIdToTitle) {
      if (containerIdToTitle.has(id)) continue
      containerIdToTitle.set(id, title)
    }
    for (const e of st.edges.filter(isEdgeWithEndpoints)) {
      const src = st.idToFqn.get(e.source)
      const tgt = st.idToFqn.get(e.target)
      if (src && tgt) {
        const key = `${src}|${tgt}`
        if (relationKeyToEdge.has(key)) continue
        relationKeyToEdge.set(key, { src, tgt, cell: e })
      }
    }
    for (const [hex, name] of st.hexToCustomName) {
      if (hexToCustomName.has(hex)) continue
      hexToCustomName.set(hex, name)
    }
    viewInfos.push({
      viewId: st.viewId,
      viewTitle: st.viewTitle,
      viewDesc: st.viewDesc,
      viewNotation: st.viewNotation,
      fqnSet: new Set(st.idToFqn.values()),
    })
  }

  return {
    fqnToCell,
    byId,
    containerIdToTitle,
    relationKeyToEdge,
    hexToCustomName,
    viewInfos,
  }
}

/** Build parent → children FQN map and root FQNs (single responsibility). */
function buildRootsFromFqnToCell(fqnToCell: Map<string, DrawioCell>): {
  rootsFromMap: Map<string, string[]>
  rootFqns: string[]
} {
  const rootsFromMap = new Map<string, string[]>()
  for (const fqn of fqnToCell.keys()) {
    const parent = fqn.includes('.') ? fqn.split('.').slice(0, -1).join('.') : ''
    if (parent && fqnToCell.has(parent)) {
      const list = rootsFromMap.get(parent) ?? []
      list.push(fqn)
      rootsFromMap.set(parent, list)
    } else {
      const list = rootsFromMap.get('') ?? []
      list.push(fqn)
      rootsFromMap.set('', list)
    }
  }
  return { rootsFromMap, rootFqns: rootsFromMap.get('') ?? [] }
}

/** Emit specification + model { elements + edges } for multi-diagram (single responsibility). */
function emitMultiDiagramModel(
  lines: string[],
  merged: MergedMultiState,
  rootsFromMap: Map<string, string[]>,
  rootFqns: string[],
): void {
  if (merged.hexToCustomName.size > 0) {
    lines.push('specification {')
    for (const [hex, name] of merged.hexToCustomName) {
      lines.push(`  color ${name} ${hex}`)
    }
    lines.push('}', '')
  }
  lines.push('model {', '')

  const idToCellMulti = new Map<string, DrawioCell>()
  for (const [fqn, cell] of merged.fqnToCell) idToCellMulti.set(fqn, cell)
  const childrenMulti = new Map<string, Array<{ cellId: string; fqn: string }>>()
  for (const [parentFqn, childFqns] of rootsFromMap) {
    if (parentFqn === '') continue
    const list = childFqns.map(cf => ({ cellId: cf, fqn: cf }))
    if (list.length > 0) childrenMulti.set(parentFqn, list)
  }
  const emitCtxMulti: ElementEmitContext = {
    lines,
    idToCell: idToCellMulti,
    containerIdToTitle: merged.containerIdToTitle,
    children: childrenMulti,
    hexToCustomName: merged.hexToCustomName,
    byId: merged.byId,
  }
  for (const fqn of rootFqns) {
    emitElement.toLines(emitCtxMulti, fqn, fqn, 1)
  }

  const edgeEntriesMulti: EdgeEntry[] = []
  for (const { src, tgt, cell } of merged.relationKeyToEdge.values()) {
    edgeEntriesMulti.push({ cell, src, tgt })
  }
  emitEdgesToLines(lines, edgeEntriesMulti, merged.hexToCustomName)
  lines.push('}', '')
}

/**
 * Convert DrawIO XML to LikeC4 source when file has multiple diagrams (tabs).
 * Merges elements by FQN and relations by (source, target); emits one model and one view per diagram.
 */
export function parseDrawioToLikeC4Multi(xml: string): string {
  const diagrams = getAllDiagrams(xml)
  if (diagrams.length === 0) {
    return `model {

}
views {
  view index {
    include *
  }
}
`
  }
  if (diagrams.length === 1) return parseDrawioToLikeC4(xml)

  const states: DiagramState[] = []
  for (const d of diagrams) {
    const s = buildDiagramState(d.content, d.name)
    if (s) states.push(s)
  }
  if (states.length === 0) return parseDrawioToLikeC4(xml)

  const merged = mergeDiagramStatesIntoMaps(states)
  const { rootsFromMap, rootFqns } = buildRootsFromFqnToCell(merged.fqnToCell)

  const lines: string[] = []
  emitMultiDiagramModel(lines, merged, rootsFromMap, rootFqns)

  lines.push('views {')
  for (const v of merged.viewInfos) {
    const includeList = [...v.fqnSet].sort((a, b) => a.localeCompare(b))
    lines.push(
      `  view ${v.viewId} {`,
      ...(v.viewTitle ? [`    title '${escapeLikec4Quotes(v.viewTitle)}'`] : []),
      ...(v.viewDesc ? [`    description '${escapeLikec4Quotes(v.viewDesc)}'`] : []),
      `    include ${includeList.length > 0 ? includeList.join(', ') : '*'}`,
      '  }',
    )
  }
  lines.push('}', '')

  for (const v of merged.viewInfos) {
    if (v.viewNotation) {
      lines.push(`// likec4.view.notation ${v.viewId} '${escapeLikec4Quotes(v.viewNotation)}'`)
    }
  }

  emitRoundtripCommentsMulti(lines, states)
  return lines.join('\n')
}

/** Data extracted from DrawIO round-trip comment blocks in .c4 source (for re-export). */
export type DrawioRoundtripData = {
  layoutByView: Record<
    string,
    { nodes: Record<string, { x: number; y: number; width: number; height: number }> }
  >
  strokeColorByFqn: Record<string, string>
  strokeWidthByFqn: Record<string, string>
  /** Key = "src|tgt" or "src|tgt|edgeId" (FQN, optional edge id for parallel edges), value = array of [x, y] waypoints */
  edgeWaypoints: Record<string, number[][]>
}

const LAYOUT_START = '// <likec4.layout.drawio>'
const LAYOUT_END = '// </likec4.layout.drawio>'
const STROKE_COLOR_START = '// <likec4.strokeColor.vertices>'
const STROKE_COLOR_END = '// </likec4.strokeColor.vertices>'
const STROKE_WIDTH_START = '// <likec4.strokeWidth.vertices>'
const STROKE_WIDTH_END = '// </likec4.strokeWidth.vertices>'
const WAYPOINTS_START = '// <likec4.edge.waypoints>'
const WAYPOINTS_END = '// </likec4.edge.waypoints>'

/**
 * Parse DrawIO round-trip comment blocks from .c4 source.
 * Returns structured data to pass as GenerateDrawioOptions for re-export, or null if no blocks found.
 */
export function parseDrawioRoundtripComments(c4Source: string): DrawioRoundtripData | null {
  const lines = c4Source.split(/\r?\n/)
  let layoutByView: DrawioRoundtripData['layoutByView'] = {}
  let strokeColorByFqn: Record<string, string> = {}
  let strokeWidthByFqn: Record<string, string> = {}
  let edgeWaypoints: Record<string, number[][]> = {}
  let found = false

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line == null) {
      i += 1
      continue
    }
    if (line.trim() === LAYOUT_START) {
      found = true
      i += 1
      const layoutLines: string[] = []
      while (i < lines.length && lines[i]?.trim() !== LAYOUT_END) {
        const ln = lines[i]?.trim()
        if (ln?.startsWith('// ')) layoutLines.push(ln.slice(3))
        i += 1
      }
      if (layoutLines.length > 0) {
        try {
          const json = layoutLines.join('\n')
          layoutByView = JSON.parse(json) as DrawioRoundtripData['layoutByView']
        } catch {
          // ignore invalid JSON
        }
      }
      i += 1
      continue
    }
    if (line.trim() === STROKE_COLOR_START) {
      found = true
      i += 1
      while (i < lines.length && lines[i]?.trim() !== STROKE_COLOR_END) {
        const ln = lines[i]
        if (ln?.trim().startsWith('// ') && ln.includes('=')) {
          const rest = ln.slice(3).trim()
          const eq = rest.indexOf('=')
          if (eq > 0) {
            const fqn = rest.slice(0, eq).trim()
            const hex = rest.slice(eq + 1).trim()
            if (fqn && hex) strokeColorByFqn[fqn] = hex
          }
        }
        i += 1
      }
      continue
    }
    if (line.trim() === STROKE_WIDTH_START) {
      found = true
      i += 1
      while (i < lines.length && lines[i]?.trim() !== STROKE_WIDTH_END) {
        const ln = lines[i]
        if (ln?.trim().startsWith('// ') && ln.includes('=')) {
          const rest = ln.slice(3).trim()
          const eq = rest.indexOf('=')
          if (eq > 0) {
            const fqn = rest.slice(0, eq).trim()
            const val = rest.slice(eq + 1).trim()
            if (fqn && val !== '') strokeWidthByFqn[fqn] = val
          }
        }
        i += 1
      }
      continue
    }
    if (line.trim() === WAYPOINTS_START) {
      found = true
      i += 1
      while (i < lines.length && lines[i]?.trim() !== WAYPOINTS_END) {
        const ln = lines[i]
        if (ln?.trim().startsWith('// ')) {
          const rest = ln.slice(3).trim()
          const space = rest.indexOf(' ')
          if (space > 0) {
            const key = rest.slice(0, space).trim()
            const json = rest.slice(space + 1).trim()
            if (key && json) {
              try {
                const pts = JSON.parse(json) as number[][]
                if (Array.isArray(pts)) edgeWaypoints[key] = pts
              } catch {
                // ignore
              }
            }
          }
        }
        i += 1
      }
      continue
    }
    i += 1
  }

  if (found) {
    return {
      layoutByView,
      strokeColorByFqn,
      strokeWidthByFqn,
      edgeWaypoints,
    }
  }
  return null
}
