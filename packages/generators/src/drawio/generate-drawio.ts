import { LikeC4Styles } from '@likec4/core'
import type { BBox } from '@likec4/core'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type {
  aux,
  DiagramNode,
  ElementColorValues,
  MarkdownOrString,
  NodeId,
  ProcessedView,
  RelationshipColorValues,
  ThemeColorValues,
} from '@likec4/core/types'
import { flattenMarkdownOrString } from '@likec4/core/types'
import pako from 'pako'
import { isEmptyish, isNullish as isNil } from 'remeda'

/**
 * DrawIO expects diagram content as base64(deflateRaw(encodeURIComponent(xml))).
 * @internal
 */
function compressDrawioDiagramXml(xml: string): string {
  const encoded = encodeURIComponent(xml)
  const bytes = new TextEncoder().encode(encoded)
  const compressed = pako.deflateRaw(bytes)
  return uint8ArrayToBase64(compressed)
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk)
    binary += String.fromCharCode.apply(null, [...slice])
  }
  return btoa(binary)
}

type View = ProcessedView<aux.Unknown>
type Node = View['nodes'][number]
type Edge = View['edges'][number]

/** Project styles or central default (LikeC4Styles.DEFAULT) when view has no $styles. */
function getEffectiveStyles(viewmodel: LikeC4ViewModel<aux.Unknown>): LikeC4Styles {
  return ('$styles' in viewmodel && viewmodel.$styles ? viewmodel.$styles : null) ?? LikeC4Styles.DEFAULT
}

/** Escape for use inside XML attributes and text. */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Escape for use inside HTML (e.g. cell value with html=1). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Theme color key valid for styles.theme.colors; falls back to primary/gray for elements/edges. */
function resolveThemeColor(
  styles: { theme: { colors: Record<string, unknown> } },
  color: string | undefined,
  fallback: 'primary' | 'gray',
): string {
  if (color && color in styles.theme.colors) return color
  return fallback
}

/**
 * Map LikeC4 element shape to draw.io cell style string.
 * DrawIO uses shape=rectangle, cylinder3, etc.; default rectangles use rounded=1.
 */
function drawioShape(shape: Node['shape']): string {
  switch (shape) {
    case 'person':
      return 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;'
    case 'rectangle':
      return 'shape=rectangle;rounded=1;'
    case 'browser':
      return 'shape=rectangle;rounded=1;'
    case 'mobile':
      return 'shape=rectangle;rounded=1;'
    case 'cylinder':
      return 'shape=cylinder3;whiteSpace=wrap;boundedLbl=1;backgroundOutline=1;size=15;'
    case 'queue':
      return 'shape=cylinder3;whiteSpace=wrap;boundedLbl=1;backgroundOutline=1;size=15;'
    case 'storage':
      return 'shape=cylinder3;whiteSpace=wrap;boundedLbl=1;backgroundOutline=1;size=15;'
    case 'bucket':
      return 'shape=rectangle;rounded=1;'
    case 'document':
      return 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;'
    default:
      return 'shape=rectangle;rounded=1;'
  }
}

type ElementColors = { fill: string; stroke: string; font: string }

/**
 * Resolve element fill, stroke and font colors from project styles or default theme.
 * Uses ElementColorValues (hiContrast for font when present).
 */
function getElementColors(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  color: string,
): ElementColors | undefined {
  const styles = getEffectiveStyles(viewmodel)
  const themeColor = resolveThemeColor(styles, color, 'primary')
  try {
    const values = styles.colors(themeColor) as ThemeColorValues
    const el = values.elements
    return {
      fill: el.fill,
      stroke: el.stroke,
      font: (el.hiContrast ?? el.stroke) as string,
    }
  } catch {
    const values = LikeC4Styles.DEFAULT.colors('primary') as ThemeColorValues
    const el = values.elements
    return {
      fill: el.fill,
      stroke: el.stroke,
      font: (el.hiContrast ?? el.stroke) as string,
    }
  }
}

/** Edge stroke (line) color from theme RelationshipColorValues.line. */
function getEdgeStrokeColor(viewmodel: LikeC4ViewModel<aux.Unknown>, color: string | undefined): string {
  const styles = getEffectiveStyles(viewmodel)
  const themeColor = resolveThemeColor(styles, color ?? 'gray', 'gray')
  try {
    const values = styles.colors(themeColor) as ThemeColorValues
    return values.relationships.line as string
  } catch {
    return LikeC4Styles.DEFAULT.colors('gray').relationships.line as string
  }
}

/** Edge label font color from theme RelationshipColorValues.label for readability. */
function getEdgeLabelColor(viewmodel: LikeC4ViewModel<aux.Unknown>, color: string | undefined): string {
  const styles = getEffectiveStyles(viewmodel)
  const themeColor = resolveThemeColor(styles, color ?? 'gray', 'gray')
  try {
    const values = styles.colors(themeColor) as ThemeColorValues
    const rel = values.relationships as RelationshipColorValues
    return (rel.label ?? rel.line) as string
  } catch {
    return getEdgeStrokeColor(viewmodel, 'gray')
  }
}

/**
 * Compute draw.io exit/entry anchors (0–1) from source to target bbox centers
 * so edges connect on the correct sides (LikeC4-style layout).
 */
function edgeAnchors(
  sourceBbox: BBox,
  targetBbox: BBox,
): { exitX: number; exitY: number; entryX: number; entryY: number } {
  const sCx = sourceBbox.x + sourceBbox.width / 2
  const sCy = sourceBbox.y + sourceBbox.height / 2
  const tCx = targetBbox.x + targetBbox.width / 2
  const tCy = targetBbox.y + targetBbox.height / 2
  const dx = tCx - sCx
  const dy = tCy - sCy
  const hor = Math.abs(dx) >= Math.abs(dy)
  const exitX = hor ? (dx >= 0 ? 1 : 0) : 0.5
  const exitY = hor ? 0.5 : dy >= 0 ? 1 : 0
  const entryX = hor ? (dx >= 0 ? 0 : 1) : 0.5
  const entryY = hor ? 0.5 : dy >= 0 ? 0 : 1
  return { exitX, exitY, entryX, entryY }
}

/**
 * Map LikeC4 RelationshipArrowType to draw.io endArrow/startArrow style value.
 */
function drawioArrow(arrow: string | undefined | null): string {
  switch (arrow) {
    case 'none':
      return 'none'
    case 'open':
    case 'onormal':
    case 'vee':
      return 'open'
    case 'diamond':
    case 'odiamond':
      return 'diamond'
    case 'dot':
    case 'odot':
      return 'oval'
    case 'crow':
      return 'block'
    case 'normal':
    default:
      return 'block'
  }
}

/** Optional overrides for round-trip (e.g. from parsed comment blocks). Keys are node/edge ids from the view. */
export type GenerateDrawioOptions = {
  /** Node id -> bbox to use instead of viewmodel layout */
  layoutOverride?: Record<string, BBox>
  /** Node id -> stroke color hex (e.g. from likec4.strokeColor.vertices comment) */
  strokeColorByNodeId?: Record<string, string>
  /** Node id -> stroke width (e.g. from likec4.strokeWidth.vertices comment) */
  strokeWidthByNodeId?: Record<string, string>
  /** Edge "source|target" (FQN) -> array of [x, y] waypoints (e.g. from likec4.edge.waypoints comment) */
  edgeWaypoints?: Record<string, number[][]>
  /** If false, embed raw mxGraphModel XML inside <diagram> (no base64/deflate). Draw.io accepts both. */
  compressed?: boolean
}

/**
 * Generate DrawIO (mxGraph) XML from a layouted LikeC4 view.
 * Preserves positions, hierarchy, colors, descriptions and technology so the diagram
 * can be opened and edited in draw.io with full compatibility.
 *
 * @param viewmodel - Layouted LikeC4 view model (from model.view(id))
 * @param options - Optional overrides for layout/colors (round-trip from comment blocks)
 * @returns DrawIO .drawio XML string
 */
export function generateDrawio(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  options?: GenerateDrawioOptions,
): string {
  const view = viewmodel.$view
  const { nodes, edges } = view
  const layoutOverride = options?.layoutOverride
  const strokeColorByNodeId = options?.strokeColorByNodeId
  const strokeWidthByNodeId = options?.strokeWidthByNodeId
  const edgeWaypoints = options?.edgeWaypoints
  const useCompressed = options?.compressed !== false

  const rootId = '0'
  const defaultParentId = '1'

  const nodeIds = new Map<NodeId, string>()
  let cellId = 2

  const getCellId = (nodeId: NodeId): string => {
    let id = nodeIds.get(nodeId)
    if (!id) {
      id = String(cellId++)
      nodeIds.set(nodeId, id)
    }
    return id
  }

  const containerCells: string[] = []
  const vertexCells: string[] = []
  const edgeCells: string[] = []

  const sortedNodes = [...nodes].sort((a, b) => {
    if (isNil(a.parent) && isNil(b.parent)) return 0
    if (isNil(a.parent)) return -1
    if (isNil(b.parent)) return 1
    if (a.parent === b.parent) return 0
    if (a.id.startsWith(b.id + '.')) return 1
    if (b.id.startsWith(a.id + '.')) return -1
    return 0
  })

  /** Support BBox from layout, legacy position/size, or layoutOverride for round-trip. */
  const getBBox = (n: View['nodes'][number]): BBox => {
    const over = layoutOverride?.[n.id]
    if (over) return over
    const d = n as DiagramNode & { position?: [number, number]; size?: { width: number; height: number } }
    const x = typeof d.x === 'number' ? d.x : (Array.isArray(d.position) ? d.position[0] : 0)
    const y = typeof d.y === 'number' ? d.y : (Array.isArray(d.position) ? d.position[1] : 0)
    const width = typeof d.width === 'number' ? d.width : (d.size?.width ?? 120)
    const height = typeof d.height === 'number' ? d.height : (d.size?.height ?? 60)
    return { x, y, width, height }
  }

  const bboxes = new Map<NodeId, BBox>()
  for (const node of sortedNodes) bboxes.set(node.id, getBBox(node))

  const nodeIdsInView = new Set<NodeId>((nodes as Node[]).map(n => n.id))
  /** Only nodes that have at least one child present in this view are containers (bounded context). Others stay normal. */
  const containerNodeIds = new Set(
    (nodes as Node[]).filter(
      n =>
        Array.isArray(n.children) &&
        n.children.length > 0 &&
        n.children.some((childId: NodeId) => nodeIdsInView.has(childId)),
    ).map(n => n.id),
  )

  /** Container as group wrapper: bbox = union of direct children (in view) + padding, drawn behind children. */
  const CONTAINER_PADDING = 16
  const containerNodesSorted = [...sortedNodes]
    .filter(n => containerNodeIds.has(n.id))
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
  for (const node of containerNodesSorted) {
    const children = (node as Node & { children?: NodeId[] }).children ?? []
    const inView = children.filter((id: NodeId) => nodeIdsInView.has(id))
    if (inView.length === 0) continue
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const cid of inView) {
      const b = bboxes.get(cid)
      if (!b) continue
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }
    if (minX !== Infinity) {
      bboxes.set(node.id, {
        x: minX - CONTAINER_PADDING,
        y: minY - CONTAINER_PADDING,
        width: maxX - minX + 2 * CONTAINER_PADDING,
        height: maxY - minY + 2 * CONTAINER_PADDING,
      })
    }
  }

  let contentMinX = Infinity
  let contentMinY = Infinity
  let contentMaxX = -Infinity
  let contentMaxY = -Infinity
  for (const b of bboxes.values()) {
    contentMinX = Math.min(contentMinX, b.x)
    contentMinY = Math.min(contentMinY, b.y)
    contentMaxX = Math.max(contentMaxX, b.x + b.width)
    contentMaxY = Math.max(contentMaxY, b.y + b.height)
  }
  if (contentMinX === Infinity) contentMinX = 0
  if (contentMinY === Infinity) contentMinY = 0
  if (contentMaxX === -Infinity) contentMaxX = contentMinX + 800
  if (contentMaxY === -Infinity) contentMaxY = contentMinY + 600
  const contentCx = contentMinX + (contentMaxX - contentMinX) / 2
  const contentCy = contentMinY + (contentMaxY - contentMinY) / 2
  let pageBounds: BBox = { x: 0, y: 0, width: 800, height: 600 }
  try {
    const b = viewmodel.bounds
    if (b != null && typeof b.x === 'number') pageBounds = b
  } catch {
    // not layouted
  }
  const offsetX = pageBounds.x + pageBounds.width / 2 - contentCx
  const offsetY = pageBounds.y + pageBounds.height / 2 - contentCy

  for (const node of sortedNodes) {
    const id = getCellId(node.id)
    const parentId = node.parent ? getCellId(node.parent) : defaultParentId
    const bbox = bboxes.get(node.id)!
    const { width, height } = bbox
    const x = bbox.x + offsetX
    const y = bbox.y + offsetY

    const title = node.title
    const descRaw = flattenMarkdownOrString(node.description)
    const techRaw = flattenMarkdownOrString(node.technology)
    const notesRaw = flattenMarkdownOrString((node as Node & { notes?: MarkdownOrString }).notes)
    const desc = descRaw != null && !isEmptyish(descRaw) ? descRaw.trim() : ''
    const tech = techRaw != null && !isEmptyish(techRaw) ? techRaw.trim() : ''
    const notes = notesRaw != null && !isEmptyish(notesRaw) ? notesRaw.trim() : ''
    const tags = (node as Node & { tags?: readonly string[] }).tags
    const tagList = Array.isArray(tags) && tags.length > 0 ? tags.join(',') : ''
    const navigateTo = (node as Node & { navigateTo?: string | null }).navigateTo
    const navTo = navigateTo != null && navigateTo !== '' ? String(navigateTo) : ''
    const icon = (node as Node & { icon?: string | null }).icon
    const iconName = icon != null && icon !== '' ? String(icon) : ''

    const isContainer = containerNodeIds.has(node.id)
    const shapeStyle = isContainer
      ? 'shape=rectangle;rounded=0;container=1;'
      : drawioShape(node.shape)
    const strokeColorOverride = strokeColorByNodeId?.[node.id]
    const strokeWidthOverride = strokeWidthByNodeId?.[node.id]
    const elemColors = strokeColorOverride
      ? ((): ElementColors => {
        const base = getElementColors(viewmodel, node.color)
        return {
          fill: base?.fill ?? '#dae8fc',
          stroke: strokeColorOverride,
          font: base?.font ?? strokeColorOverride,
        }
      })()
      : getElementColors(viewmodel, node.color)
    const fillHex = elemColors?.fill ?? '#dae8fc'
    const strokeHex = elemColors?.stroke ?? '#2563eb'
    const fontHex = elemColors?.font ?? elemColors?.stroke ?? '#1e40af'
    const colorStyle = `fillColor=${fillHex};strokeColor=${strokeHex};fontColor=${fontHex};`
    const valueHtml = desc !== ''
      ? `<div style="box-sizing:border-box;width:100%;min-height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:${fontHex};"><b style="font-size:12px;">${
        escapeHtml(title)
      }</b><br/><span style="font-weight:normal;font-size:12px;">${escapeHtml(desc)}</span></div>`
      : escapeHtml(title)
    const value = escapeXml(valueHtml)
    const nodeStyle = node.style as {
      border?: string
      opacity?: number
      size?: string
      padding?: string
      textSize?: string
      iconPosition?: string
    } | undefined
    const borderVal = nodeStyle?.border
    const strokeWidth = strokeWidthOverride ?? (borderVal === 'none' ? '0' : isContainer ? '1' : borderVal ? '1' : '')
    const strokeWidthStyle = strokeWidth !== '' ? `strokeWidth=${strokeWidth};` : ''
    const containerDashed = isContainer && borderVal !== 'none'
      ? 'dashed=1;'
      : borderVal === 'dashed'
      ? 'dashed=1;'
      : ''
    const containerOpacityNum = isContainer === true ? (nodeStyle?.opacity ?? 15) : undefined
    const fillOpacityStyle = containerOpacityNum != null && isContainer === true
      ? `fillOpacity=${Math.min(100, Math.max(0, containerOpacityNum))};`
      : ''
    const summaryRaw = (node as Node & { summary?: MarkdownOrString }).summary
    const summaryStr = summaryRaw != null && !isEmptyish(flattenMarkdownOrString(summaryRaw))
      ? flattenMarkdownOrString(summaryRaw)!.trim()
      : ''
    const links = (node as Node & { links?: readonly { url: string; title?: string }[] }).links
    const linksJson = Array.isArray(links) && links.length > 0
      ? encodeURIComponent(JSON.stringify(links.map(l => ({ url: l.url, title: l.title }))))
      : ''
    /** Only container nodes get fillOpacity; normal nodes stay fully opaque. */
    const opacityStyle = fillOpacityStyle
    const colorNameForRoundtrip = node.color ? encodeURIComponent(String(node.color)) : ''

    const likec4Extra: string[] = []
    if (desc !== '') likec4Extra.push(`likec4Description=${encodeURIComponent(desc)}`)
    if (tech !== '') likec4Extra.push(`likec4Technology=${encodeURIComponent(tech)}`)
    if (notes !== '') likec4Extra.push(`likec4Notes=${encodeURIComponent(notes)}`)
    if (tagList !== '') likec4Extra.push(`likec4Tags=${encodeURIComponent(tagList)}`)
    if (navTo !== '') likec4Extra.push(`likec4NavigateTo=${encodeURIComponent(navTo)}`)
    if (iconName !== '') likec4Extra.push(`likec4Icon=${encodeURIComponent(iconName)}`)
    if (summaryStr !== '') likec4Extra.push(`likec4Summary=${encodeURIComponent(summaryStr)}`)
    if (linksJson !== '') likec4Extra.push(`likec4Links=${linksJson}`)
    if (borderVal) likec4Extra.push(`likec4Border=${encodeURIComponent(borderVal)}`)
    if (containerOpacityNum != null) likec4Extra.push(`likec4Opacity=${containerOpacityNum}`)
    if (strokeWidth !== '') likec4Extra.push(`likec4StrokeWidth=${encodeURIComponent(strokeWidth)}`)
    if (colorNameForRoundtrip !== '') likec4Extra.push(`likec4ColorName=${colorNameForRoundtrip}`)
    if (nodeStyle?.size) likec4Extra.push(`likec4Size=${encodeURIComponent(nodeStyle.size)}`)
    if (nodeStyle?.padding) likec4Extra.push(`likec4Padding=${encodeURIComponent(nodeStyle.padding)}`)
    if (nodeStyle?.textSize) likec4Extra.push(`likec4TextSize=${encodeURIComponent(nodeStyle.textSize)}`)
    if (nodeStyle?.iconPosition) likec4Extra.push(`likec4IconPosition=${encodeURIComponent(nodeStyle.iconPosition)}`)
    if (strokeHex && /^#[0-9A-Fa-f]{3,8}$/.test(strokeHex)) {
      likec4Extra.push(`likec4StrokeColor=${encodeURIComponent(strokeHex)}`)
    }
    const nodeNotation = (node as Node & { notation?: string }).notation
    if (nodeNotation != null && nodeNotation !== '') {
      likec4Extra.push(`likec4Notation=${encodeURIComponent(nodeNotation)}`)
    }
    const likec4Style = likec4Extra.length > 0 ? likec4Extra.join(';') + ';' : ''

    const nodeCustomData = (node as Node & { customData?: Record<string, string> }).customData
    const userObjectXml = nodeCustomData &&
        typeof nodeCustomData === 'object' &&
        !Array.isArray(nodeCustomData) &&
        Object.keys(nodeCustomData).length > 0
      ? '\n  <mxUserObject>' +
        Object.entries(nodeCustomData)
          .map(
            ([k, v]) => `<data key="${escapeXml(k)}">${escapeXml(String(v ?? ''))}</data>`,
          )
          .join('') +
        '</mxUserObject>'
      : ''

    const navLinkStyle = navTo !== ''
      ? `link=${encodeURIComponent(`data:action/json,{"actions":[{"open":"data:page/id,likec4-${navTo}"}]}`)};`
      : ''
    const fontSizeVal = nodeStyle?.textSize ?? '12'
    const vertexTextStyle =
      `align=center;verticalAlign=middle;verticalLabelPosition=middle;labelPosition=center;fontSize=${fontSizeVal};fontStyle=1;spacingTop=4;spacingLeft=2;spacingRight=2;spacingBottom=2;overflow=fill;whiteSpace=wrap;html=1;`

    const cellXml =
      `<mxCell id="${id}" value="${value}" style="${vertexTextStyle}${shapeStyle}${colorStyle}${strokeWidthStyle}${containerDashed}${opacityStyle}${navLinkStyle}${likec4Style}html=1;" vertex="1" parent="${parentId}">
  <mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${
        Math.round(height)
      }" as="geometry" />${userObjectXml}
</mxCell>`
    if (isContainer) containerCells.push(cellXml)
    else vertexCells.push(cellXml)
  }

  for (const edge of edges as Edge[]) {
    const id = String(cellId++)
    const sourceId = getCellId(edge.source)
    const targetId = getCellId(edge.target)
    const sourceBbox = bboxes.get(edge.source)
    const targetBbox = bboxes.get(edge.target)
    const anchors = sourceBbox && targetBbox
      ? edgeAnchors(sourceBbox, targetBbox)
      : { exitX: 1, exitY: 0.5, entryX: 0, entryY: 0.5 }
    const anchorStyle =
      `exitX=${anchors.exitX};exitY=${anchors.exitY};entryX=${anchors.entryX};entryY=${anchors.entryY};`
    const label = edge.label ? escapeXml(edge.label) : ''
    const strokeColor = getEdgeStrokeColor(viewmodel, edge.color)
    const dashStyle = edge.line === 'dashed' ? 'dashed=1;' : edge.line === 'dotted' ? 'dashed=1;dashPattern=1 1;' : ''
    const endArrow = drawioArrow(edge.head)
    const startArrow = drawioArrow(edge.tail)
    const edgeDescRaw = flattenMarkdownOrString(edge.description)
    const edgeTechRaw = flattenMarkdownOrString(edge.technology)
    const edgeNotesRaw = flattenMarkdownOrString(edge.notes)
    const edgeDesc = edgeDescRaw != null && !isEmptyish(edgeDescRaw) ? edgeDescRaw.trim() : ''
    const edgeTech = edgeTechRaw != null && !isEmptyish(edgeTechRaw) ? edgeTechRaw.trim() : ''
    const edgeNotes = edgeNotesRaw != null && !isEmptyish(edgeNotesRaw) ? edgeNotesRaw.trim() : ''
    const edgeNavTo = edge.navigateTo != null && edge.navigateTo !== '' ? String(edge.navigateTo) : ''
    const edgeKind = (edge as Edge & { kind?: string }).kind
    const edgeNotation = (edge as Edge & { notation?: string }).notation
    const edgeLikec4: string[] = []
    if (edgeDesc !== '') edgeLikec4.push(`likec4Description=${encodeURIComponent(edgeDesc)}`)
    if (edgeTech !== '') edgeLikec4.push(`likec4Technology=${encodeURIComponent(edgeTech)}`)
    if (edgeNotes !== '') edgeLikec4.push(`likec4Notes=${encodeURIComponent(edgeNotes)}`)
    if (edgeNavTo !== '') edgeLikec4.push(`likec4NavigateTo=${encodeURIComponent(edgeNavTo)}`)
    if (edgeKind != null && edgeKind !== '') {
      edgeLikec4.push(`likec4RelationshipKind=${encodeURIComponent(String(edgeKind))}`)
    }
    if (edgeNotation != null && edgeNotation !== '') {
      edgeLikec4.push(`likec4Notation=${encodeURIComponent(edgeNotation)}`)
    }
    const edgeLinks = (edge as Edge & { links?: readonly { url: string; title?: string }[] }).links
    const edgeLinksJson = Array.isArray(edgeLinks) && edgeLinks.length > 0
      ? encodeURIComponent(JSON.stringify(edgeLinks.map(l => ({ url: l.url, title: l.title }))))
      : ''
    if (edgeLinksJson !== '') edgeLikec4.push(`likec4Links=${edgeLinksJson}`)
    const edgeMetadata = (edge as Edge & { metadata?: Record<string, string | string[]> }).metadata
    const edgeMetadataJson = edgeMetadata &&
        typeof edgeMetadata === 'object' &&
        !Array.isArray(edgeMetadata) &&
        Object.keys(edgeMetadata).length > 0
      ? encodeURIComponent(JSON.stringify(edgeMetadata))
      : ''
    if (edgeMetadataJson !== '') edgeLikec4.push(`likec4Metadata=${edgeMetadataJson}`)
    const edgeLikec4Style = edgeLikec4.length > 0 ? edgeLikec4.join(';') + ';' : ''

    const edgeCustomData = (edge as Edge & { customData?: Record<string, string> }).customData
    const edgeUserObjectXml = edgeCustomData &&
        typeof edgeCustomData === 'object' &&
        !Array.isArray(edgeCustomData) &&
        Object.keys(edgeCustomData).length > 0
      ? '\n  <mxUserObject>' +
        Object.entries(edgeCustomData)
          .map(
            ([k, v]) => `<data key="${escapeXml(k)}">${escapeXml(String(v ?? ''))}</data>`,
          )
          .join('') +
        '</mxUserObject>'
      : ''

    const rawEdgePoints = (edge as { points?: readonly (readonly [number, number])[] }).points ??
      edgeWaypoints?.[`${edge.source}|${edge.target}`]
    /** Flatten to [x,y][] so we never emit nested <Array><Array> (draw.io rejects it). */
    const edgePoints: [number, number][] = Array.isArray(rawEdgePoints)
      ? rawEdgePoints.flatMap((pt: readonly (readonly [number, number])[] | number[] | { x: number; y: number }) =>
        Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number'
          ? [[pt[0], pt[1]] as [number, number]]
          : (typeof (pt as { x?: number; y?: number }).x === 'number' &&
              typeof (pt as { x?: number; y?: number }).y === 'number'
            ? [[(pt as { x: number; y: number }).x, (pt as { x: number; y: number }).y] as [number, number]]
            : [])
      )
      : []
    const hasPoints = edgePoints.length > 0
    const pointsXml = hasPoints
      ? '<Array as="points">' +
        edgePoints
          .map(([px, py], i) => {
            const asAttr = i === 0 ? ' as="sourcePoint"' : i === edgePoints.length - 1 ? ' as="targetPoint"' : ''
            return `<mxPoint x="${Math.round(px)}" y="${Math.round(py)}"${asAttr}/>`
          })
          .join('') +
        '</Array>'
      : ''

    const edgeGeometryXml = hasPoints
      ? `<mxGeometry relative="0" as="geometry">${pointsXml}</mxGeometry>`
      : '<mxGeometry relative="1" as="geometry" />'

    const edgeLabelColor = getEdgeLabelColor(viewmodel, edge.color)
    const edgeLabelStyle = label !== ''
      ? `labelBackgroundColor=#ffffff;fontColor=${edgeLabelColor};fontSize=12;align=center;verticalAlign=middle;labelBorderColor=${strokeColor};`
      : ''
    edgeCells.push(
      `<mxCell id="${id}" value="${label}" style="endArrow=${endArrow};startArrow=${startArrow};html=1;rounded=0;${anchorStyle}strokeColor=${strokeColor};strokeWidth=2;${dashStyle}${edgeLabelStyle}${edgeLikec4Style}" edge="1" parent="${defaultParentId}" source="${sourceId}" target="${targetId}">
  ${edgeGeometryXml}${edgeUserObjectXml}
</mxCell>`,
    )
  }

  const viewTitle = typeof (view as { title?: string | null }).title === 'string'
    ? (view as { title: string }).title
    : null
  const viewDescRaw = (view as { description?: unknown }).description
  const viewDesc = viewDescRaw != null && typeof viewDescRaw === 'object' && 'txt' in viewDescRaw
    ? String((viewDescRaw as { txt: string }).txt)
    : viewDescRaw != null && typeof viewDescRaw === 'object' && 'md' in viewDescRaw
    ? String((viewDescRaw as { md: string }).md)
    : typeof viewDescRaw === 'string'
    ? viewDescRaw
    : ''
  const viewDescEnc = viewDesc.trim() !== '' ? encodeURIComponent(viewDesc.trim()) : ''
  const viewNotationRaw = (view as unknown as { notation?: unknown }).notation
  const viewNotation = typeof viewNotationRaw === 'string' && viewNotationRaw !== '' ? viewNotationRaw : undefined
  const viewNotationEnc = viewNotation != null ? encodeURIComponent(viewNotation) : ''
  const rootParts = [
    'rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;',
    `likec4ViewTitle=${encodeURIComponent(viewTitle ?? view.id)};`,
    viewDescEnc !== '' ? `likec4ViewDescription=${viewDescEnc};` : '',
    viewNotationEnc !== '' ? `likec4ViewNotation=${viewNotationEnc};` : '',
  ]
  const rootCellStyle = rootParts.join('')

  const allCells = [
    `<mxCell id="${defaultParentId}" value="" style="${rootCellStyle}" vertex="1" parent="${rootId}">
  <mxGeometry x="${pageBounds.x}" y="${pageBounds.y}" width="${pageBounds.width}" height="${pageBounds.height}" as="geometry" />
</mxCell>`,
    ...containerCells,
    ...vertexCells,
    ...edgeCells,
  ].join('\n')

  const diagramName = (viewTitle ?? view.id).trim() || view.id
  const mxGraphModelXml =
    `<mxGraphModel dx="800" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="${rootId}" />
        ${allCells}
      </root>
    </mxGraphModel>`
  const diagramContent = useCompressed
    ? compressDrawioDiagramXml(mxGraphModelXml)
    : mxGraphModelXml

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
  <diagram name="${escapeXml(diagramName)}" id="likec4-${escapeXml(view.id)}">${diagramContent}</diagram>
</mxfile>
`
}

/**
 * Generate a single DrawIO file with multiple diagrams (tabs).
 * Each view becomes one tab in draw.io. Use this when exporting a project
 * so all views open in one file with one tab per view.
 *
 * @param viewmodels - Layouted view models (e.g. from model.views())
 * @param optionsByViewId - Optional per-view options (e.g. compressed: false for each tab)
 * @returns DrawIO .drawio XML string with multiple <diagram> elements
 */
export function generateDrawioMulti(
  viewmodels: Array<LikeC4ViewModel<aux.Unknown>>,
  optionsByViewId?: Record<string, GenerateDrawioOptions>,
): string {
  if (viewmodels.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
</mxfile>
`
  }
  if (viewmodels.length === 1) {
    const opts = optionsByViewId?.[viewmodels[0]!.$view.id]
    return generateDrawio(viewmodels[0]!, opts)
  }
  const diagramParts = viewmodels.map(vm => {
    const view = vm.$view
    const opts = optionsByViewId?.[view.id]
    const single = generateDrawio(vm, opts)
    const m = single.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/)
    if (!m) return ''
    const diagramName = (typeof (view as { title?: string | null }).title === 'string'
      ? (view as { title: string }).title
      : null) ?? view.id
    return `  <diagram name="${escapeXml(diagramName)}" id="likec4-${escapeXml(view.id)}">${m[1]}</diagram>`
  }).filter(Boolean)
  const pagesAttr = diagramParts.length > 0 ? ` pages="${diagramParts.length}"` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${
    new Date().toISOString()
  }" agent="LikeC4" version="1.0" etag="" type="device"${pagesAttr}>
${diagramParts.join('\n')}
</mxfile>
`
}
