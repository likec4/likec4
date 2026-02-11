/**
 * Parse DrawIO (mxGraph) XML and generate LikeC4 source code.
 * Extracts vertices as elements and edges as relations; preserves colors, descriptions,
 * technology and other compatible attributes for full bidirectional compatibility.
 */

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
  /** From mxUserObject data likec4Description / likec4Technology (exported by LikeC4) */
  description?: string
  technology?: string
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
    const attrs = m[1]
    const inner = m[2] ?? ''
    const id = getAttr(attrs, 'id')
    if (!id) continue
    const value = getAttr(attrs, 'value')
    const parent = getAttr(attrs, 'parent')
    const source = getAttr(attrs, 'source')
    const target = getAttr(attrs, 'target')
    const vertex = getAttr(attrs, 'vertex') === '1'
    const edge = getAttr(attrs, 'edge') === '1'
    const style = getAttr(attrs, 'style')
    const fullTag = m[0]
    const geomMatch = fullTag.match(/<mxGeometry[^>]*>/i)
    const geomStr = geomMatch ? geomMatch[0] : ''
    const styleMap = parseStyle(style)
    const userData = parseUserData(inner)
    const cell: DrawioCell = {
      id,
      value: value ? decodeXmlEntities(value) : undefined,
      parent,
      source,
      target,
      vertex,
      edge,
      style,
      x: parseNum(geomAttr(geomStr, 'x')),
      y: parseNum(geomAttr(geomStr, 'y')),
      width: parseNum(geomAttr(geomStr, 'width')),
      height: parseNum(geomAttr(geomStr, 'height')),
      fillColor: styleMap.get('fillcolor') ?? styleMap.get('fillColor'),
      strokeColor: styleMap.get('strokecolor') ?? styleMap.get('strokeColor'),
      description: userData.description,
      technology: userData.technology,
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
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/**
 * Infer LikeC4 element kind from DrawIO shape style.
 */
function inferKind(style: string | undefined): 'actor' | 'system' | 'container' | 'component' {
  if (!style) return 'container'
  const s = style.toLowerCase()
  if (s.includes('umlactor') || s.includes('shape=person')) return 'actor'
  if (s.includes('swimlane') || s.includes('shape=rectangle') && s.includes('rounded')) return 'system'
  return 'container'
}

/**
 * Sanitize a string for use as LikeC4 identifier (element name).
 */
function toId(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/^[0-9]/, '_$&') || 'element'
}

/**
 * Convert DrawIO XML to LikeC4 source (.c4) string.
 * - Vertices become model elements (actor/container); hierarchy from parent refs.
 * - Edges become relations (->).
 * - Root diagram cells (parent "1") are top-level; others are nested by parent.
 */
export function parseDrawioToLikeC4(xml: string): string {
  const cells = parseDrawioXml(xml)
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

  // Collect unique hex colors from vertices for specification customColors
  const hexToCustomName = new Map<string, string>()
  let customColorIndex = 0
  for (const v of vertices) {
    const fill = v.fillColor?.trim()
    if (fill && /^#[0-9A-Fa-f]{3,8}$/.test(fill)) {
      if (!hexToCustomName.has(fill)) {
        hexToCustomName.set(fill, `drawio_color_${++customColorIndex}`)
      }
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

  function emitElement(cellId: string, fqn: string, indent: number): void {
    const cell = idToCell.get(cellId)
    if (!cell) return
    const kind = inferKind(cell.style)
    const title = (cell.value && cell.value.trim()) || fqn.split('.').pop() || 'Element'
    const name = fqn.split('.').pop()!
    const pad = '  '.repeat(indent)
    const desc = cell.description?.trim()
    const tech = cell.technology?.trim()
    const colorName =
      cell.fillColor && /^#[0-9A-Fa-f]{3,8}$/.test(cell.fillColor.trim())
        ? hexToCustomName.get(cell.fillColor.trim())
        : undefined

    if (kind === 'actor') {
      lines.push(`${pad}${name} = actor '${title.replace(/'/g, "''")}'`)
    } else if (kind === 'system') {
      lines.push(`${pad}${name} = system '${title.replace(/'/g, "''")}'`)
    } else {
      lines.push(`${pad}${name} = container '${title.replace(/'/g, "''")}'`)
    }
    const childList = children.get(fqn)
    const hasBody = (childList && childList.length > 0) || desc || tech || colorName
    if (hasBody) {
      lines.push(`${pad}{`)
      if (colorName) lines.push(`${pad}  style { color ${colorName} }`)
      if (desc) lines.push(`${pad}  description '${desc.replace(/'/g, "''")}'`)
      if (tech) lines.push(`${pad}  technology '${tech.replace(/'/g, "''")}'`)
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
    const label = (e.value && e.value.trim()) ? ` '${e.value.replace(/'/g, "''")}'` : ''
    lines.push(`  ${src} -> ${tgt}${label}`)
  }

  lines.push('}')
  lines.push('')
  lines.push('views {')
  lines.push('  view index {')
  lines.push('    include *')
  lines.push('  }')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}
