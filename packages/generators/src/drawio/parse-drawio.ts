/**
 * Parse DrawIO (mxGraph) XML and generate LikeC4 source code.
 * Extracts vertices as elements and edges as relations; preserves colors, descriptions,
 * technology and other compatible attributes for full bidirectional compatibility.
 * Supports both uncompressed (raw mxGraphModel inside <diagram>) and compressed
 * (base64 + deflate, draw.io default) diagram content.
 */

import pako from 'pako'

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
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}="([^"]*)"`, 'i')
  const m = attrs.match(re)
  return m ? m[1] : undefined
}

function parseNum(s: string | undefined): number | undefined {
  if (s === undefined || s === '') return undefined
  const n = Number.parseFloat(s)
  return Number.isNaN(n) ? undefined : n
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

/** Extract LikeC4 custom data from mxUserObject/data inside cell XML. */
function parseUserData(fullTag: string): { description?: string; technology?: string } {
  const out: { description?: string; technology?: string } = {}
  const descMatch = fullTag.match(/<data\s+key="likec4Description"[^>]*>([\s\S]*?)<\/data>/i)
  if (descMatch?.[1]) out.description = decodeXmlEntities(descMatch[1].trim())
  const techMatch = fullTag.match(/<data\s+key="likec4Technology"[^>]*>([\s\S]*?)<\/data>/i)
  if (techMatch?.[1]) out.technology = decodeXmlEntities(techMatch[1].trim())
  return out
}

/**
 * Simple XML parser for DrawIO mxCell elements. Extracts cells with id, value, parent,
 * source, target, vertex, edge, geometry, style colors and LikeC4 user data.
 */
function parseDrawioXml(xml: string): DrawioCell[] {
  const cells: DrawioCell[] = []
  const mxCellRe = /<mxCell\s+([^>]+?)(?:\s*\/>|>([\s\S]*?)<\/mxCell>)/gi
  const geomAttr = (tag: string, name: string) => getAttr(tag, name)
  let m
  while ((m = mxCellRe.exec(xml)) !== null) {
    const attrs = m[1] ?? ''
    const inner = m[2] ?? ''
    const id = getAttr(attrs, 'id')
    if (!id) continue
    const valueRaw = getAttr(attrs, 'value')
    const parent = getAttr(attrs, 'parent')
    const source = getAttr(attrs, 'source')
    const target = getAttr(attrs, 'target')
    const vertex = getAttr(attrs, 'vertex') === '1'
    const edge = getAttr(attrs, 'edge') === '1'
    const style = getAttr(attrs, 'style')
    const fullTag = m[0]
    const geomMatch = fullTag.match(/<mxGeometry[^>]*>/i)
    const geomStr = geomMatch ? geomMatch[0] : ''
    const styleMap = parseStyle(style ?? undefined)
    const userData = parseUserData(inner)
    const x = parseNum(geomAttr(geomStr, 'x'))
    const y = parseNum(geomAttr(geomStr, 'y'))
    const width = parseNum(geomAttr(geomStr, 'width'))
    const height = parseNum(geomAttr(geomStr, 'height'))
    const fillColor = styleMap.get('fillcolor') ?? styleMap.get('fillColor')
    const strokeColor = styleMap.get('strokecolor') ?? styleMap.get('strokeColor')
    const descFromStyle = styleMap.get('likec4description')
    const techFromStyle = styleMap.get('likec4technology')
    const notesFromStyle = styleMap.get('likec4notes')
    const tagsFromStyle = styleMap.get('likec4tags')
    const navFromStyle = styleMap.get('likec4navigateto')
    const iconFromStyle = styleMap.get('likec4icon')
    const description = userData.description ??
      (descFromStyle != null && descFromStyle !== '' ? decodeURIComponent(descFromStyle) : undefined)
    const technology = userData.technology ??
      (techFromStyle != null && techFromStyle !== '' ? decodeURIComponent(techFromStyle) : undefined)
    const notes = notesFromStyle != null && notesFromStyle !== '' ? decodeURIComponent(notesFromStyle) : undefined
    const tags = tagsFromStyle != null && tagsFromStyle !== '' ? decodeURIComponent(tagsFromStyle) : undefined
    const navigateTo = navFromStyle != null && navFromStyle !== '' ? decodeURIComponent(navFromStyle) : undefined
    const icon = iconFromStyle != null && iconFromStyle !== '' ? decodeURIComponent(iconFromStyle) : undefined
    const endArrow = styleMap.get('endarrow')
    const startArrow = styleMap.get('startarrow')
    const dashed = styleMap.get('dashed')
    const dashPattern = styleMap.get('dashpattern')
    const summaryFromStyle = styleMap.get('likec4summary')
    const linksFromStyle = styleMap.get('likec4links')
    const borderFromStyle = styleMap.get('likec4border')
    const colorNameFromStyle = styleMap.get('likec4colorname')
    const opacityFromStyle = styleMap.get('opacity')
    const relKindFromStyle = styleMap.get('likec4relationshipkind')
    const notationFromStyle = styleMap.get('likec4notation')
    const summary = summaryFromStyle != null && summaryFromStyle !== ''
      ? decodeURIComponent(summaryFromStyle)
      : undefined
    const links = linksFromStyle != null && linksFromStyle !== '' ? decodeURIComponent(linksFromStyle) : undefined
    const border = borderFromStyle != null && borderFromStyle !== '' ? decodeURIComponent(borderFromStyle) : undefined
    const strokeWidthFromStyle = styleMap.get('strokewidth')
    const strokeWidth = strokeWidthFromStyle != null && strokeWidthFromStyle !== '' ? strokeWidthFromStyle : undefined
    const sizeFromStyle = styleMap.get('likec4size')
    const size = sizeFromStyle != null && sizeFromStyle !== '' ? decodeURIComponent(sizeFromStyle) : undefined
    const paddingFromStyle = styleMap.get('likec4padding')
    const padding = paddingFromStyle != null && paddingFromStyle !== ''
      ? decodeURIComponent(paddingFromStyle)
      : undefined
    const textSizeFromStyle = styleMap.get('likec4textsize')
    const textSize = textSizeFromStyle != null && textSizeFromStyle !== ''
      ? decodeURIComponent(textSizeFromStyle)
      : undefined
    const iconPositionFromStyle = styleMap.get('likec4iconposition')
    const iconPosition = iconPositionFromStyle != null && iconPositionFromStyle !== ''
      ? decodeURIComponent(iconPositionFromStyle)
      : undefined
    const linkFromStyle = styleMap.get('link')
    const link = linkFromStyle != null && linkFromStyle !== '' ? decodeURIComponent(linkFromStyle) : undefined
    const colorName = colorNameFromStyle != null && colorNameFromStyle !== ''
      ? decodeURIComponent(colorNameFromStyle)
      : undefined
    const opacity = opacityFromStyle != null && opacityFromStyle !== '' ? opacityFromStyle : undefined
    const relationshipKind = relKindFromStyle != null && relKindFromStyle !== ''
      ? decodeURIComponent(relKindFromStyle)
      : undefined
    const notation = notationFromStyle != null && notationFromStyle !== ''
      ? decodeURIComponent(notationFromStyle)
      : undefined
    const metadataFromStyle = styleMap.get('likec4metadata')
    const metadata = metadataFromStyle != null && metadataFromStyle !== ''
      ? decodeURIComponent(metadataFromStyle)
      : undefined
    const cell: DrawioCell = {
      id,
      ...(valueRaw != null && valueRaw !== '' ? { value: decodeXmlEntities(valueRaw) } : {}),
      ...(parent != null && parent !== '' ? { parent } : {}),
      ...(source != null && source !== '' ? { source } : {}),
      ...(target != null && target !== '' ? { target } : {}),
      vertex,
      edge,
      ...(style != null && style !== '' ? { style } : {}),
      ...(x !== undefined ? { x } : {}),
      ...(y !== undefined ? { y } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(fillColor !== undefined ? { fillColor } : {}),
      ...(strokeColor !== undefined ? { strokeColor } : {}),
      ...(description != null ? { description } : {}),
      ...(technology != null ? { technology } : {}),
      ...(notes != null ? { notes } : {}),
      ...(tags != null ? { tags } : {}),
      ...(navigateTo != null ? { navigateTo } : {}),
      ...(icon != null ? { icon } : {}),
      ...(endArrow != null && endArrow !== '' ? { endArrow } : {}),
      ...(startArrow != null && startArrow !== '' ? { startArrow } : {}),
      ...(dashed != null && dashed !== '' ? { dashed } : {}),
      ...(dashPattern != null && dashPattern !== '' ? { dashPattern } : {}),
      ...(summary != null ? { summary } : {}),
      ...(links != null ? { links } : {}),
      ...(link != null && vertex ? { link } : {}),
      ...(border != null ? { border } : {}),
      ...(strokeWidth != null && vertex ? { strokeWidth } : {}),
      ...(size != null && vertex ? { size } : {}),
      ...(padding != null && vertex ? { padding } : {}),
      ...(textSize != null && vertex ? { textSize } : {}),
      ...(iconPosition != null && vertex ? { iconPosition } : {}),
      ...(colorName != null ? { colorName } : {}),
      ...(opacity != null ? { opacity } : {}),
      ...(relationshipKind != null ? { relationshipKind } : {}),
      ...(notation != null ? { notation } : {}),
      ...(metadata != null && edge ? { metadata } : {}),
    }
    cells.push(cell)
  }
  return cells
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
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
    if (pattern === '1 1' || pattern === '2 2' || /^[\d.]+\s+[\d.]+$/.test(pattern)) return 'dotted'
    return 'dashed'
  }
  return undefined
}

/**
 * Infer LikeC4 element kind from DrawIO shape style.
 */
function inferKind(style: string | undefined): 'actor' | 'system' | 'container' | 'component' {
  if (!style) return 'container'
  const s = style.toLowerCase()
  if (s.includes('umlactor') || s.includes('shape=person')) return 'actor'
  if (s.includes('swimlane')) return 'system'
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
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^[0-9]/, '_$&') || 'element'
}

/** Decompress draw.io diagram content: base64 → inflateRaw → decodeURIComponent. */
function decompressDrawioDiagram(base64Content: string): string {
  const trimmed = base64Content.trim()
  let bytes: Uint8Array
  if (typeof Buffer !== 'undefined') {
    bytes = new Uint8Array(Buffer.from(trimmed, 'base64'))
  } else {
    const binary = atob(trimmed)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  }
  const inflated = pako.inflateRaw(bytes, { to: 'string' })
  return decodeURIComponent(inflated)
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
  return all[0] ?? { name: 'index', id: 'likec4-index', content: '' }
}

/**
 * Extract all diagram name, id and content from mxfile (for multi-tab .drawio).
 */
function getAllDiagrams(fullXml: string): DiagramInfo[] {
  const results: DiagramInfo[] = []
  const re = /<diagram\s*([^>]*?)>([\s\S]*?)<\/diagram>/gi
  let m
  while ((m = re.exec(fullXml)) !== null) {
    const attrs = m[1] ?? ''
    const inner = m[2] ?? ''
    const nameMatch = attrs.match(/\bname="([^"]*)"/i)
    const idMatch = attrs.match(/\bid="([^"]*)"/i)
    const name = nameMatch?.[1] ?? (results.length === 0 ? 'index' : `diagram_${results.length + 1}`)
    const id = idMatch?.[1] ?? `likec4-${name}`
    const content = inner.includes('<mxGraphModel') ? inner : decompressDrawioDiagram(inner)
    results.push({ name, id, content })
  }
  return results
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
  const byId = new Map<string, DrawioCell>()
  for (const c of cells) {
    byId.set(c.id, c)
  }

  const vertices = cells.filter(c => c.vertex && c.id !== '1')
  const edges = cells.filter(c => c.edge && c.source && c.target)

  // Build hierarchy: root is parent "1". Assign FQN by traversing parent chain.
  const rootId = '1'
  const idToFqn = new Map<string, string>()
  const idToCell = new Map<string, DrawioCell>()
  for (const v of vertices) {
    idToCell.set(v.id, v)
  }

  // Assign FQNs: use value as base name, ensure uniqueness. Flatten for simplicity if no clear hierarchy.
  const usedNames = new Set<string>()
  function uniqueName(base: string): string {
    let name = toId(base || 'element')
    let n = name
    let i = 0
    while (usedNames.has(n)) {
      n = `${name}_${++i}`
    }
    usedNames.add(n)
    return n
  }

  for (const v of vertices) {
    if (v.parent === rootId || !v.parent) {
      const name = uniqueName(v.value ?? v.id)
      idToFqn.set(v.id, name)
    }
  }

  // If we have parent refs that are not root, build hierarchy (e.g. parent is another vertex)
  let changed = true
  while (changed) {
    changed = false
    for (const v of vertices) {
      if (idToFqn.has(v.id)) continue
      const parent = v.parent ? idToFqn.get(v.parent) : null
      if (parent != null) {
        const local = uniqueName(v.value ?? v.id)
        idToFqn.set(v.id, `${parent}.${local}`)
        changed = true
      }
    }
  }

  // Any remaining vertices (orphans) get top-level names
  for (const v of vertices) {
    if (!idToFqn.has(v.id)) {
      idToFqn.set(v.id, uniqueName(v.value ?? v.id))
    }
  }

  // Collect unique hex colors from vertices for specification customColors; prefer likec4ColorName when present
  const hexToCustomName = new Map<string, string>()
  let customColorIndex = 0
  for (const v of vertices) {
    const fill = v.fillColor?.trim()
    if (fill && /^#[0-9A-Fa-f]{3,8}$/.test(fill)) {
      if (v.colorName && v.colorName.trim() !== '') {
        const name = v.colorName.trim().replace(/\s+/g, '_')
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

  const lines: string[] = []

  if (hexToCustomName.size > 0) {
    lines.push('specification {')
    for (const [hex, name] of hexToCustomName) {
      lines.push(`  color ${name} ${hex}`)
    }
    lines.push('}')
    lines.push('')
  }

  lines.push('model {')
  lines.push('')

  const children = new Map<string, Array<{ cellId: string; fqn: string }>>()
  const roots: Array<{ cellId: string; fqn: string }> = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = idToCell.get(cellId)
    if (!cell) continue
    if (cell.parent === rootId || !cell.parent) {
      roots.push({ cellId, fqn })
    } else {
      const parentFqn = idToFqn.get(cell.parent)
      if (parentFqn != null) {
        const list = children.get(parentFqn) ?? []
        list.push({ cellId, fqn })
        children.set(parentFqn, list)
      } else {
        roots.push({ cellId, fqn })
      }
    }
  }

  /** Strip HTML tags for use as plain title when emitting .c4 */
  function stripHtmlForTitle(raw: string | undefined): string {
    if (!raw || raw.trim() === '') return ''
    const decoded = raw
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
    return decoded.replace(/<[^>]+>/g, '').trim().split(/\n|<br\s*\/?>/i)[0]?.trim() ?? ''
  }

  function emitElement(cellId: string, fqn: string, indent: number): void {
    const cell = idToCell.get(cellId)
    if (!cell) return
    const kind = inferKind(cell.style)
    const rawTitle = (cell.value && cell.value.trim()) || ''
    const title = stripHtmlForTitle(rawTitle) || fqn.split('.').pop() || 'Element'
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
    const border = cell.border?.trim()
    const colorName = cell.fillColor && /^#[0-9A-Fa-f]{3,8}$/.test(cell.fillColor.trim())
      ? hexToCustomName.get(cell.fillColor.trim())
      : undefined
    const shapeOverride = inferShape(cell.style)

    if (kind === 'actor') {
      lines.push(`${pad}${name} = actor '${title.replace(/'/g, '\'\'')}'`)
    } else if (kind === 'system') {
      lines.push(`${pad}${name} = system '${title.replace(/'/g, '\'\'')}'`)
    } else {
      lines.push(`${pad}${name} = container '${title.replace(/'/g, '\'\'')}'`)
    }
    const childList = children.get(fqn)
    const opacityVal = cell.opacity
    const hasBody = (childList && childList.length > 0) ||
      desc ||
      tech ||
      notes ||
      summary ||
      linksJson ||
      nativeLink ||
      notation ||
      tagList.length > 0 ||
      colorName ||
      border ||
      opacityVal ||
      shapeOverride ||
      cell.size ||
      cell.padding ||
      cell.textSize ||
      cell.iconPosition ||
      navigateTo ||
      icon
    if (hasBody) {
      lines.push(`${pad}{`)
      const sizeVal = cell.size?.trim()
      const paddingVal = cell.padding?.trim()
      const textSizeVal = cell.textSize?.trim()
      const iconPositionVal = cell.iconPosition?.trim()
      if (
        colorName ||
        border ||
        opacityVal ||
        shapeOverride ||
        sizeVal ||
        paddingVal ||
        textSizeVal ||
        iconPositionVal
      ) {
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
        if (styleParts.length > 0) lines.push(`${pad}  style { ${styleParts.join(', ')} }`)
      }
      for (const t of tagList) lines.push(`${pad}  #${t.replace(/\s+/g, '_')}`)
      if (desc) lines.push(`${pad}  description '${desc.replace(/'/g, '\'\'')}'`)
      if (tech) lines.push(`${pad}  technology '${tech.replace(/'/g, '\'\'')}'`)
      if (summary) lines.push(`${pad}  summary '${summary.replace(/'/g, '\'\'')}'`)
      if (notes) lines.push(`${pad}  notes '${notes.replace(/'/g, '\'\'')}'`)
      if (notation) lines.push(`${pad}  notation '${notation.replace(/'/g, '\'\'')}'`)
      try {
        const linksArr = linksJson ? (JSON.parse(linksJson) as { url: string; title?: string }[]) : null
        if (Array.isArray(linksArr)) {
          for (const link of linksArr) {
            if (link?.url) {
              lines.push(
                `${pad}  link '${String(link.url).replace(/'/g, '\'\'')}'${
                  link.title ? ` '${String(link.title).replace(/'/g, '\'\'')}'` : ''
                }`,
              )
            }
          }
        } else if (nativeLink) {
          lines.push(`${pad}  link '${nativeLink.replace(/'/g, '\'\'')}'`)
        }
      } catch {
        // ignore invalid JSON; fallback to native link
        if (nativeLink) lines.push(`${pad}  link '${nativeLink.replace(/'/g, '\'\'')}'`)
      }
      if (navigateTo) lines.push(`${pad}  navigateTo ${navigateTo}`)
      if (icon) lines.push(`${pad}  icon '${icon.replace(/'/g, '\'\'')}'`)
      if (childList && childList.length > 0) {
        for (const ch of childList) {
          emitElement(ch.cellId, ch.fqn, indent + 1)
        }
      }
      lines.push(`${pad}}`)
    } else {
      lines.push(`${pad}{`)
      lines.push(`${pad}}`)
    }
    lines.push('')
  }

  for (const { cellId, fqn } of roots) {
    emitElement(cellId, fqn, 1)
  }

  for (const e of edges) {
    const src = idToFqn.get(e.source!)
    const tgt = idToFqn.get(e.target!)
    if (!src || !tgt) continue
    const title = (e.value && e.value.trim()) ? e.value.replace(/'/g, '\'\'').trim() : ''
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
    const hasBody = notes || navTo || head || tail || line || notation || linksJson || metadataJson || edgeStrokeHex

    const arrowPart = relKind && /^[a-zA-Z0-9_-]+$/.test(relKind) ? ` -[${relKind}]-> ` : ' -> '
    const titlePart = title ? ` '${title}'` : desc || tech ? ` ''` : ''
    const descPart = desc ? ` '${desc.replace(/'/g, '\'\'')}'` : ''
    const techPart = tech ? ` '${tech.replace(/'/g, '\'\'')}'` : ''
    const relationHead = `  ${src}${arrowPart}${tgt}${titlePart}${descPart}${techPart}`

    if (hasBody) {
      const bodyLines: string[] = []
      if (notes) bodyLines.push(`    notes '${notes.replace(/'/g, '\'\'')}'`)
      if (navTo) bodyLines.push(`    navigateTo ${navTo}`)
      if (notation) bodyLines.push(`    notation '${notation.replace(/'/g, '\'\'')}'`)
      try {
        const linksArr = linksJson ? (JSON.parse(linksJson) as { url: string; title?: string }[]) : null
        if (Array.isArray(linksArr)) {
          for (const link of linksArr) {
            if (link?.url) {
              bodyLines.push(
                `    link '${String(link.url).replace(/'/g, '\'\'')}'${
                  link.title ? ` '${String(link.title).replace(/'/g, '\'\'')}'` : ''
                }`,
              )
            }
          }
        }
      } catch {
        // ignore invalid JSON
      }
      try {
        const metaObj = metadataJson ? (JSON.parse(metadataJson) as Record<string, string | string[]>) : null
        if (metaObj && typeof metaObj === 'object' && !Array.isArray(metaObj)) {
          const metaAttrs: string[] = []
          for (const [k, v] of Object.entries(metaObj)) {
            if (k.trim() === '') continue
            const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `'${k.replace(/'/g, '\'\'')}'`
            if (Array.isArray(v)) {
              const arrVals = v.map(s => `'${String(s).replace(/'/g, '\'\'')}'`)
              metaAttrs.push(` ${safeKey} [ ${arrVals.join(', ')} ];`)
            } else if (v != null && typeof v === 'string') {
              metaAttrs.push(` ${safeKey} '${v.replace(/'/g, '\'\'')}';`)
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
        const styleParts: string[] = []
        if (line) styleParts.push(`line ${line}`)
        if (head) styleParts.push(`head ${head}`)
        if (tail) styleParts.push(`tail ${tail}`)
        if (edgeStrokeHex && /^#[0-9A-Fa-f]{3,8}$/.test(edgeStrokeHex)) {
          const edgeColorName = hexToCustomName.get(edgeStrokeHex)
          if (edgeColorName) styleParts.push(`color ${edgeColorName}`)
        }
        if (styleParts.length > 0) bodyLines.push(`    style { ${styleParts.join(', ')} }`)
      }
      lines.push(relationHead + ' {')
      lines.push(...bodyLines)
      lines.push('  }')
    } else {
      lines.push(relationHead)
    }
  }

  lines.push('}')
  lines.push('')
  const viewId = toId(diagramName) || 'index'
  const rootCell = byId.get('1')
  const rootStyle = rootCell?.style ? parseStyle(rootCell.style) : new Map<string, string>()
  const viewTitleRaw = rootStyle.get('likec4viewtitle')
  const viewDescRaw = rootStyle.get('likec4viewdescription')
  const viewTitle = viewTitleRaw != null && viewTitleRaw !== '' ? decodeURIComponent(viewTitleRaw) : ''
  const viewDesc = viewDescRaw != null && viewDescRaw !== '' ? decodeURIComponent(viewDescRaw) : ''
  lines.push('views {')
  lines.push(`  view ${viewId} {`)
  if (viewTitle) lines.push(`    title '${viewTitle.replace(/'/g, '\'\'')}'`)
  if (viewDesc) lines.push(`    description '${viewDesc.replace(/'/g, '\'\'')}'`)
  lines.push('    include *')
  lines.push('  }')
  lines.push('}')
  lines.push('')

  // Emit layout as comment for round-trip or tooling (Phase 1.2)
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
  if (Object.keys(layoutNodes).length > 0) {
    const layoutBlock = JSON.stringify({ [viewId]: { nodes: layoutNodes } })
    lines.push('// <likec4.layout.drawio>')
    lines.push('// ' + layoutBlock)
    lines.push('// </likec4.layout.drawio>')
  }

  // Emit vertex strokeColor as comment for round-trip (Phase 1.3; DSL has no element strokeColor)
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
  if (strokeColorLines.length > 0) {
    lines.push('// <likec4.strokeColor.vertices>')
    lines.push(...strokeColorLines)
    lines.push('// </likec4.strokeColor.vertices>')
  }

  const strokeWidthLines: string[] = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = byId.get(cellId)
    if (cell?.vertex && cell.strokeWidth != null && cell.strokeWidth.trim() !== '') {
      strokeWidthLines.push(`// ${fqn}=${cell.strokeWidth.trim()}`)
    }
  }
  if (strokeWidthLines.length > 0) {
    lines.push('// <likec4.strokeWidth.vertices>')
    lines.push(...strokeWidthLines)
    lines.push('// </likec4.strokeWidth.vertices>')
  }

  return lines.join('\n')
}

/** Per-diagram state for merging multiple diagrams. */
interface DiagramState {
  idToFqn: Map<string, string>
  idToCell: Map<string, DrawioCell>
  roots: Array<{ cellId: string; fqn: string }>
  children: Map<string, Array<{ cellId: string; fqn: string }>>
  hexToCustomName: Map<string, string>
  edges: DrawioCell[]
  viewId: string
  viewTitle: string
  viewDesc: string
}

function buildDiagramState(content: string, diagramName: string): DiagramState | null {
  const cells = parseDrawioXml(content)
  const byId = new Map<string, DrawioCell>()
  for (const c of cells) byId.set(c.id, c)
  const vertices = cells.filter(c => c.vertex && c.id !== '1')
  const edges = cells.filter(c => c.edge && c.source && c.target)
  const rootId = '1'
  const idToFqn = new Map<string, string>()
  const idToCell = new Map<string, DrawioCell>()
  for (const v of vertices) idToCell.set(v.id, v)
  const usedNames = new Set<string>()
  function uniqueName(base: string): string {
    let name = toId(base || 'element')
    let n = name
    let i = 0
    while (usedNames.has(n)) n = `${name}_${++i}`
    usedNames.add(n)
    return n
  }
  for (const v of vertices) {
    if (v.parent === rootId || !v.parent) idToFqn.set(v.id, uniqueName(v.value ?? v.id))
  }
  let changed = true
  while (changed) {
    changed = false
    for (const v of vertices) {
      if (idToFqn.has(v.id)) continue
      const parent = v.parent ? idToFqn.get(v.parent) : null
      if (parent != null) {
        idToFqn.set(v.id, `${parent}.${uniqueName(v.value ?? v.id)}`)
        changed = true
      }
    }
  }
  for (const v of vertices) {
    if (!idToFqn.has(v.id)) idToFqn.set(v.id, uniqueName(v.value ?? v.id))
  }
  const hexToCustomName = new Map<string, string>()
  let ci = 0
  let ei = 0
  for (const v of vertices) {
    const fill = v.fillColor?.trim()
    if (fill && /^#[0-9A-Fa-f]{3,8}$/.test(fill)) {
      if (v.colorName?.trim()) {
        if (!hexToCustomName.has(fill)) hexToCustomName.set(fill, v.colorName!.trim().replace(/\s+/g, '_'))
      } else if (!hexToCustomName.has(fill)) hexToCustomName.set(fill, `drawio_color_${++ci}`)
    }
  }
  for (const e of edges) {
    const stroke = e.strokeColor?.trim()
    if (stroke && /^#[0-9A-Fa-f]{3,8}$/.test(stroke) && !hexToCustomName.has(stroke)) {
      hexToCustomName.set(stroke, `drawio_edge_color_${++ei}`)
    }
  }
  const children = new Map<string, Array<{ cellId: string; fqn: string }>>()
  const roots: Array<{ cellId: string; fqn: string }> = []
  for (const [cellId, fqn] of idToFqn) {
    const cell = idToCell.get(cellId)
    if (!cell) continue
    if (cell.parent === rootId || !cell.parent) {
      roots.push({ cellId, fqn })
    } else {
      const parentFqn = idToFqn.get(cell.parent)
      if (parentFqn != null) {
        const list = children.get(parentFqn) ?? []
        list.push({ cellId, fqn })
        children.set(parentFqn, list)
      } else {
        roots.push({ cellId, fqn })
      }
    }
  }
  const viewId = toId(diagramName) || 'index'
  const rootCell = byId.get('1')
  const rootStyle = rootCell?.style ? parseStyle(rootCell.style) : new Map<string, string>()
  const viewTitle = rootStyle.get('likec4viewtitle') != null && rootStyle.get('likec4viewtitle') !== ''
    ? decodeURIComponent(rootStyle.get('likec4viewtitle')!)
    : ''
  const viewDesc = rootStyle.get('likec4viewdescription') != null && rootStyle.get('likec4viewdescription') !== ''
    ? decodeURIComponent(rootStyle.get('likec4viewdescription')!)
    : ''
  return {
    idToFqn,
    idToCell,
    roots,
    children,
    hexToCustomName,
    edges,
    viewId,
    viewTitle,
    viewDesc,
  }
}

/**
 * Convert DrawIO XML to LikeC4 source when file has multiple diagrams (tabs).
 * Merges elements by FQN and relations by (source, target); emits one model and one view per diagram,
 * each view including only the FQNs that appear in that diagram.
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
  if (diagrams.length === 1) {
    return parseDrawioToLikeC4(xml)
  }
  const states: DiagramState[] = []
  for (const d of diagrams) {
    const s = buildDiagramState(d.content, d.name)
    if (s) states.push(s)
  }
  if (states.length === 0) return parseDrawioToLikeC4(xml)

  const fqnToCell = new Map<string, DrawioCell>()
  const relationKeyToEdge = new Map<string, { src: string; tgt: string; cell: DrawioCell }>()
  const hexToCustomName = new Map<string, string>()
  const viewInfos: Array<{ viewId: string; viewTitle: string; viewDesc: string; fqnSet: Set<string> }> = []

  for (const st of states) {
    for (const [cellId, fqn] of st.idToFqn) {
      const cell = st.idToCell.get(cellId)
      if (cell && !fqnToCell.has(fqn)) fqnToCell.set(fqn, cell)
    }
    for (const e of st.edges) {
      const src = st.idToFqn.get(e.source!)
      const tgt = st.idToFqn.get(e.target!)
      if (src && tgt) {
        const key = `${src}|${tgt}`
        if (!relationKeyToEdge.has(key)) relationKeyToEdge.set(key, { src, tgt, cell: e })
      }
    }
    for (const [hex, name] of st.hexToCustomName) {
      if (!hexToCustomName.has(hex)) hexToCustomName.set(hex, name)
    }
    viewInfos.push({
      viewId: st.viewId,
      viewTitle: st.viewTitle,
      viewDesc: st.viewDesc,
      fqnSet: new Set(st.idToFqn.values()),
    })
  }

  const rootsFromMap = new Map<string, string[]>()
  for (const fqn of fqnToCell.keys()) {
    const parent = fqn.includes('.') ? fqn.split('.').slice(0, -1).join('.') : ''
    if (!parent || !fqnToCell.has(parent)) {
      const list = rootsFromMap.get('') ?? []
      list.push(fqn)
      rootsFromMap.set('', list)
    } else {
      const list = rootsFromMap.get(parent) ?? []
      list.push(fqn)
      rootsFromMap.set(parent, list)
    }
  }
  const rootFqns = rootsFromMap.get('') ?? []

  const lines: string[] = []
  if (hexToCustomName.size > 0) {
    lines.push('specification {')
    for (const [hex, name] of hexToCustomName) {
      lines.push(`  color ${name} ${hex}`)
    }
    lines.push('}')
    lines.push('')
  }
  lines.push('model {')
  lines.push('')

  function stripHtmlForTitle(raw: string | undefined): string {
    if (!raw || raw.trim() === '') return ''
    const decoded = raw
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
    return decoded.replace(/<[^>]+>/g, '').trim().split(/\n|<br\s*\/?>/i)[0]?.trim() ?? ''
  }

  function emitElementMulti(fqn: string, indent: number): void {
    const cell = fqnToCell.get(fqn)
    if (!cell) return
    const kind = inferKind(cell.style)
    const rawTitle = (cell.value && cell.value.trim()) || ''
    const title = stripHtmlForTitle(rawTitle) || fqn.split('.').pop() || 'Element'
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
    const border = cell.border?.trim()
    const colorName = cell.fillColor && /^#[0-9A-Fa-f]{3,8}$/.test(cell.fillColor.trim())
      ? hexToCustomName.get(cell.fillColor.trim())
      : undefined
    const shapeOverride = inferShape(cell.style)
    const opacityVal = cell.opacity
    const childFqns = rootsFromMap.get(fqn) ?? []
    const hasBody = childFqns.length > 0 ||
      !!desc ||
      !!tech ||
      !!notes ||
      !!summary ||
      !!linksJson ||
      !!nativeLink ||
      !!notation ||
      tagList.length > 0 ||
      !!colorName ||
      !!border ||
      !!opacityVal ||
      !!shapeOverride ||
      !!cell.size ||
      !!cell.padding ||
      !!cell.textSize ||
      !!cell.iconPosition ||
      !!navigateTo ||
      !!icon
    if (kind === 'actor') {
      lines.push(`${pad}${name} = actor '${title.replace(/'/g, '\'\'')}'`)
    } else if (kind === 'system') {
      lines.push(`${pad}${name} = system '${title.replace(/'/g, '\'\'')}'`)
    } else {
      lines.push(`${pad}${name} = container '${title.replace(/'/g, '\'\'')}'`)
    }
    if (hasBody) {
      lines.push(`${pad}{`)
      const sizeVal = cell.size?.trim()
      const paddingVal = cell.padding?.trim()
      const textSizeVal = cell.textSize?.trim()
      const iconPositionVal = cell.iconPosition?.trim()
      if (
        colorName ||
        border ||
        opacityVal ||
        shapeOverride ||
        sizeVal ||
        paddingVal ||
        textSizeVal ||
        iconPositionVal
      ) {
        const styleParts: string[] = []
        if (colorName) styleParts.push(`color ${colorName}`)
        if (border && ['solid', 'dashed', 'dotted', 'none'].includes(border)) styleParts.push(`border ${border}`)
        if (opacityVal && /^\d+$/.test(opacityVal)) styleParts.push(`opacity ${opacityVal}`)
        if (shapeOverride) styleParts.push(`shape ${shapeOverride}`)
        if (sizeVal) styleParts.push(`size ${sizeVal}`)
        if (paddingVal) styleParts.push(`padding ${paddingVal}`)
        if (textSizeVal) styleParts.push(`textSize ${textSizeVal}`)
        if (iconPositionVal) styleParts.push(`iconPosition ${iconPositionVal}`)
        if (styleParts.length > 0) lines.push(`${pad}  style { ${styleParts.join(', ')} }`)
      }
      for (const t of tagList) lines.push(`${pad}  #${t.replace(/\s+/g, '_')}`)
      if (desc) lines.push(`${pad}  description '${desc.replace(/'/g, '\'\'')}'`)
      if (tech) lines.push(`${pad}  technology '${tech.replace(/'/g, '\'\'')}'`)
      if (summary) lines.push(`${pad}  summary '${summary.replace(/'/g, '\'\'')}'`)
      if (notes) lines.push(`${pad}  notes '${notes.replace(/'/g, '\'\'')}'`)
      if (notation) lines.push(`${pad}  notation '${notation.replace(/'/g, '\'\'')}'`)
      try {
        const linksArr = linksJson ? (JSON.parse(linksJson) as { url: string; title?: string }[]) : null
        if (Array.isArray(linksArr)) {
          for (const link of linksArr) {
            if (link?.url) {
              lines.push(
                `${pad}  link '${String(link.url).replace(/'/g, '\'\'')}'${
                  link.title ? ` '${String(link.title).replace(/'/g, '\'\'')}'` : ''
                }`,
              )
            }
          }
        } else if (nativeLink) {
          lines.push(`${pad}  link '${nativeLink.replace(/'/g, '\'\'')}'`)
        }
      } catch {
        // ignore; fallback to native link
        if (nativeLink) lines.push(`${pad}  link '${nativeLink.replace(/'/g, '\'\'')}'`)
      }
      if (navigateTo) lines.push(`${pad}  navigateTo ${navigateTo}`)
      if (icon) lines.push(`${pad}  icon '${icon.replace(/'/g, '\'\'')}'`)
      for (const ch of childFqns) emitElementMulti(ch, indent + 1)
      lines.push(`${pad}}`)
    } else {
      lines.push(`${pad}{`)
      lines.push(`${pad}}`)
    }
    lines.push('')
  }

  for (const fqn of rootFqns) emitElementMulti(fqn, 1)

  for (const { src, tgt, cell: e } of relationKeyToEdge.values()) {
    const title = (e.value && e.value.trim()) ? e.value.replace(/'/g, '\'\'').trim() : ''
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
    const hasBody = !!notes ||
      !!navTo ||
      !!head ||
      !!tail ||
      !!line ||
      !!notation ||
      !!linksJson ||
      !!metadataJson ||
      !!edgeStrokeHex
    const arrowPart = relKind && /^[a-zA-Z0-9_-]+$/.test(relKind) ? ` -[${relKind}]-> ` : ' -> '
    const titlePart = title ? ` '${title}'` : desc || tech ? ` ''` : ''
    const descPart = desc ? ` '${desc.replace(/'/g, '\'\'')}'` : ''
    const techPart = tech ? ` '${tech.replace(/'/g, '\'\'')}'` : ''
    const relationHead = `  ${src}${arrowPart}${tgt}${titlePart}${descPart}${techPart}`
    if (hasBody) {
      const bodyLines: string[] = []
      if (notes) bodyLines.push(`    notes '${notes.replace(/'/g, '\'\'')}'`)
      if (navTo) bodyLines.push(`    navigateTo ${navTo}`)
      if (notation) bodyLines.push(`    notation '${notation.replace(/'/g, '\'\'')}'`)
      try {
        const linksArr = linksJson ? (JSON.parse(linksJson) as { url: string; title?: string }[]) : null
        if (Array.isArray(linksArr)) {
          for (const link of linksArr) {
            if (link?.url) {
              bodyLines.push(
                `    link '${String(link.url).replace(/'/g, '\'\'')}'${
                  link.title ? ` '${String(link.title).replace(/'/g, '\'\'')}'` : ''
                }`,
              )
            }
          }
        }
      } catch {
        // ignore invalid JSON
      }
      try {
        const metaObj = metadataJson ? (JSON.parse(metadataJson) as Record<string, string | string[]>) : null
        if (metaObj && typeof metaObj === 'object' && !Array.isArray(metaObj)) {
          const metaAttrs: string[] = []
          for (const [k, v] of Object.entries(metaObj)) {
            if (k.trim() === '') continue
            const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `'${k.replace(/'/g, '\'\'')}'`
            if (Array.isArray(v)) {
              const arrVals = v.map(s => `'${String(s).replace(/'/g, '\'\'')}'`)
              metaAttrs.push(` ${safeKey} [ ${arrVals.join(', ')} ];`)
            } else if (v != null && typeof v === 'string') {
              metaAttrs.push(` ${safeKey} '${v.replace(/'/g, '\'\'')}';`)
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
        const styleParts: string[] = []
        if (line) styleParts.push(`line ${line}`)
        if (head) styleParts.push(`head ${head}`)
        if (tail) styleParts.push(`tail ${tail}`)
        if (edgeStrokeHex && /^#[0-9A-Fa-f]{3,8}$/.test(edgeStrokeHex)) {
          const n = hexToCustomName.get(edgeStrokeHex)
          if (n) styleParts.push(`color ${n}`)
        }
        if (styleParts.length > 0) bodyLines.push(`    style { ${styleParts.join(', ')} }`)
      }
      lines.push(relationHead + ' {')
      lines.push(...bodyLines)
      lines.push('  }')
    } else {
      lines.push(relationHead)
    }
  }

  lines.push('}')
  lines.push('')
  lines.push('views {')
  for (const v of viewInfos) {
    lines.push(`  view ${v.viewId} {`)
    if (v.viewTitle) lines.push(`    title '${v.viewTitle.replace(/'/g, '\'\'')}'`)
    if (v.viewDesc) lines.push(`    description '${v.viewDesc.replace(/'/g, '\'\'')}'`)
    const includeList = [...v.fqnSet].sort()
    lines.push(`    include ${includeList.length > 0 ? includeList.join(', ') : '*'}`)
    lines.push('  }')
  }
  lines.push('}')
  lines.push('')

  // Emit layout as comment for round-trip or tooling (Phase 1.2)
  const layoutByView: Record<
    string,
    { nodes: Record<string, { x: number; y: number; width: number; height: number }> }
  > = {}
  for (const st of states) {
    layoutByView[st.viewId] = { nodes: {} }
    for (const [cellId, fqn] of st.idToFqn) {
      const cell = st.idToCell.get(cellId)
      if (
        cell?.vertex &&
        cell.x != null &&
        cell.y != null &&
        cell.width != null &&
        cell.height != null
      ) {
        layoutByView[st.viewId].nodes[fqn] = {
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
        }
      }
    }
  }
  const hasLayout = Object.values(layoutByView).some(v => Object.keys(v.nodes).length > 0)
  if (hasLayout) {
    lines.push('// <likec4.layout.drawio>')
    lines.push('// ' + JSON.stringify(layoutByView))
    lines.push('// </likec4.layout.drawio>')
  }

  // Emit vertex strokeColor as comment for round-trip (Phase 1.3)
  const strokeColorLines: string[] = []
  for (const st of states) {
    for (const [cellId, fqn] of st.idToFqn) {
      const cell = st.idToCell.get(cellId)
      if (
        cell?.vertex &&
        cell.strokeColor?.trim() &&
        /^#[0-9A-Fa-f]{3,8}$/.test(cell.strokeColor.trim())
      ) {
        strokeColorLines.push(`// ${fqn}=${cell.strokeColor.trim()}`)
      }
    }
  }
  if (strokeColorLines.length > 0) {
    lines.push('// <likec4.strokeColor.vertices>')
    lines.push(...strokeColorLines)
    lines.push('// </likec4.strokeColor.vertices>')
  }

  const strokeWidthLinesMulti: string[] = []
  for (const st of states) {
    for (const [cellId, fqn] of st.idToFqn) {
      const cell = st.idToCell.get(cellId)
      if (cell?.vertex && cell.strokeWidth != null && cell.strokeWidth.trim() !== '') {
        strokeWidthLinesMulti.push(`// ${fqn}=${cell.strokeWidth.trim()}`)
      }
    }
  }
  if (strokeWidthLinesMulti.length > 0) {
    lines.push('// <likec4.strokeWidth.vertices>')
    lines.push(...strokeWidthLinesMulti)
    lines.push('// </likec4.strokeWidth.vertices>')
  }

  return lines.join('\n')
}
