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
  /** From style likec4Border (vertex: solid|dashed|dotted|none) */
  border?: string
  /** From style likec4ColorName (vertex; theme/custom color name for roundtrip) */
  colorName?: string
  /** From style opacity (vertex; 0-100) */
  opacity?: string
  /** From style likec4RelationshipKind (edge) */
  relationshipKind?: string
  /** From style likec4Notation (edge) */
  notation?: string
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
      ...(border != null ? { border } : {}),
      ...(colorName != null ? { colorName } : {}),
      ...(opacity != null ? { opacity } : {}),
      ...(relationshipKind != null ? { relationshipKind } : {}),
      ...(notation != null ? { notation } : {}),
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
  const diagramTagMatch = fullXml.match(/<diagram\s*([^>]*?)>([\s\S]*?)<\/diagram>/i)
  const attrs = diagramTagMatch?.[1] ?? ''
  let inner = diagramTagMatch?.[2] ?? ''
  const nameMatch = attrs.match(/\bname="([^"]*)"/i)
  const idMatch = attrs.match(/\bid="([^"]*)"/i)
  const name = nameMatch?.[1] ?? 'index'
  const id = idMatch?.[1] ?? 'likec4-index'
  const content = inner.includes('<mxGraphModel') ? inner : decompressDrawioDiagram(inner)
  return { name, id, content }
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
      tagList.length > 0 ||
      colorName ||
      border ||
      opacityVal ||
      shapeOverride ||
      navigateTo ||
      icon
    if (hasBody) {
      lines.push(`${pad}{`)
      if (colorName || border || opacityVal || shapeOverride) {
        const styleParts: string[] = []
        if (colorName) styleParts.push(`color ${colorName}`)
        if (border && ['solid', 'dashed', 'dotted', 'none'].includes(border)) {
          styleParts.push(`border ${border}`)
        }
        if (opacityVal && /^\d+$/.test(opacityVal)) styleParts.push(`opacity ${opacityVal}`)
        if (shapeOverride) styleParts.push(`shape ${shapeOverride}`)
        if (styleParts.length > 0) lines.push(`${pad}  style { ${styleParts.join(', ')} }`)
      }
      for (const t of tagList) lines.push(`${pad}  #${t.replace(/\s+/g, '_')}`)
      if (desc) lines.push(`${pad}  description '${desc.replace(/'/g, '\'\'')}'`)
      if (tech) lines.push(`${pad}  technology '${tech.replace(/'/g, '\'\'')}'`)
      if (summary) lines.push(`${pad}  summary '${summary.replace(/'/g, '\'\'')}'`)
      if (notes) lines.push(`${pad}  notes '${notes.replace(/'/g, '\'\'')}'`)
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
        }
      } catch {
        // ignore invalid JSON
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
    const edgeStrokeHex = e.strokeColor?.trim()
    const hasBody = notes || navTo || head || tail || line || notation || edgeStrokeHex

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

  return lines.join('\n')
}
