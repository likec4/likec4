import { LikeC4Styles } from '@likec4/core'
import type { BBox } from '@likec4/core'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type {
  aux,
  DiagramNode,
  MarkdownOrString,
  NodeId,
  ProcessedView,
  RelationshipColorValues,
  TextSize,
  ThemeColorValues,
} from '@likec4/core/types'
import { flattenMarkdownOrString } from '@likec4/core/types'
import pako from 'pako'
import { isEmptyish, isNullish as isNil } from 'remeda'
import {
  CONTAINER_TITLE_CELL_ID_START,
  CONTAINER_TITLE_CHAR_WIDTH_PX,
  CONTAINER_TITLE_COLOR,
  CONTAINER_TITLE_HEIGHT_PX,
  CONTAINER_TITLE_INSET_X,
  CONTAINER_TITLE_INSET_Y,
  CONTAINER_TITLE_MAX_WIDTH_PX,
  CONTAINER_TITLE_MIN_WIDTH_PX,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_NODE_FILL_HEX,
  DEFAULT_NODE_FONT_HEX,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_STROKE_HEX,
  DEFAULT_NODE_WIDTH,
  DRAWIO_DIAGRAM_ID_PREFIX,
  DRAWIO_PAGE_LINK_PREFIX,
  LIKEC4_FONT_FAMILY,
  MXGRAPH_PAGE_HEIGHT,
  MXGRAPH_PAGE_WIDTH,
  NODES_SPREAD_GAP,
} from './constants'
import { parseDrawioRoundtripComments } from './parse-drawio'

/**
 * DrawIO diagram generator.
 *
 * Design system alignment: colors, spacing, and font sizes are taken from the
 * viewmodel's styles (LikeC4Styles / theme). Container padding uses
 * theme.spacing (xl, xl+md for vertical). Container title uses groupColors.stroke
 * and theme.textSizes.xs. Element and edge colors use getElementColors /
 * getEdgeLabelColors from the theme. The only value not from core theme is the
 * Font family matches LikeC4 app (--likec4-app-font / --likec4-app-font-default:
 * 'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif).
 */

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
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

type View = ProcessedView<aux.Unknown>
type Node = View['nodes'][number]
type Edge = View['edges'][number]

/** Project styles or central default (LikeC4Styles.DEFAULT) when view has no $styles. */
function getEffectiveStyles(viewmodel: LikeC4ViewModel<aux.Unknown>): LikeC4Styles {
  return viewmodel.$styles ?? LikeC4Styles.DEFAULT
}

/** Escape for use inside XML attributes and text. */
function escapeXml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

/** Escape for use inside HTML (e.g. cell value with html=1). */
function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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
 * Rounded corners with reduced curvature (arcSize<1 = subtler curve, ângulo mais fechado).
 */
function drawioShape(shape: Node['shape']): string {
  const rectStyle = 'shape=rectangle;rounded=1;arcSize=0.12;'
  switch (shape) {
    case 'person':
      return 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;'
    case 'rectangle':
    case 'browser':
    case 'mobile':
    case 'bucket':
      return rectStyle
    case 'cylinder':
    case 'queue':
    case 'storage':
      return 'shape=cylinder3;whiteSpace=wrap;boundedLbl=1;backgroundOutline=1;size=15;'
    case 'document':
      return 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;'
    default:
      return rectStyle
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

/** Edge label font and background from theme (RelationshipColorValues.label, labelBg) for readable connector text. */
function getEdgeLabelColors(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  color: string | undefined,
): { font: string; background: string } {
  const styles = getEffectiveStyles(viewmodel)
  const themeColor = resolveThemeColor(styles, color ?? 'gray', 'gray')
  try {
    const values = styles.colors(themeColor) as ThemeColorValues
    const rel = values.relationships as RelationshipColorValues
    return {
      font: (rel.label ?? rel.line) as string,
      background: (rel.labelBg ?? '#ffffff') as string,
    }
  } catch {
    return {
      font: getEdgeStrokeColor(viewmodel, 'gray'),
      background: '#ffffff',
    }
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
  const exitXWhenHor = dx >= 0 ? 1 : 0
  const exitYWhenVert = dy >= 0 ? 1 : 0
  const entryXWhenHor = dx >= 0 ? 0 : 1
  const entryYWhenVert = dy >= 0 ? 0 : 1
  const exitX = hor ? exitXWhenHor : 0.5
  const exitY = hor ? 0.5 : exitYWhenVert
  const entryX = hor ? entryXWhenHor : 0.5
  const entryY = hor ? 0.5 : entryYWhenVert
  return { exitX, exitY, entryX, entryY }
}

/** Normalize one waypoint to [x, y]; returns one element or empty. */
function normalizeEdgePoint(
  pt: readonly (readonly [number, number])[] | number[] | { x: number; y: number },
): [number, number][] {
  if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
    return [[pt[0], pt[1]]]
  }
  const o = pt as { x?: number; y?: number }
  if (typeof o.x === 'number' && typeof o.y === 'number') {
    return [[o.x, o.y]]
  }
  return []
}

/** Build HTML value for a vertex cell (title only or title + description). */
function buildNodeValueHtml(
  title: string,
  desc: string,
  isContainer: boolean,
  fontHex: string,
  fontFamily: string,
  fontSizePx: number,
): string {
  if (isContainer) return ''
  if (desc !== '') {
    return `<div style="box-sizing:border-box;width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:${fontHex};font-family:${fontFamily};"><b style="font-size:${fontSizePx}px;">${
      escapeHtml(title)
    }</b><br/><span style="font-weight:normal;font-size:${fontSizePx}px;">${escapeHtml(desc)}</span></div>`
  }
  return `<div style="box-sizing:border-box;width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:${fontHex};font-family:${fontFamily};"><b style="font-size:${fontSizePx}px;">${
    escapeHtml(title)
  }</b></div>`
}

/** Push "key=value" to parts when value is set; encodes value for style string (avoids repeated conditionals). */
function pushStylePart(parts: string[], key: string, value: string | undefined | null): void {
  if (value != null && value !== '') parts.push(`${key}=${encodeURIComponent(value)}`)
}

/** Push "key=value" for numeric value (no encoding). */
function pushStylePartNum(parts: string[], key: string, value: number | undefined | null): void {
  if (value != null) parts.push(`${key}=${value}`)
}

/** Build Draw.io link= style for navigateTo (empty string when no nav). DRY for node and container title. */
function buildNavLinkStyle(navTo: string): string {
  return navTo === '' ? '' : `link=${encodeURIComponent(`${DRAWIO_PAGE_LINK_PREFIX}${navTo}`)};`
}

/** Flatten markdown/string and trim to single export string; empty when missing or empty-ish. DRY for node/edge fields. */
function toExportString(raw: MarkdownOrString | string | undefined | null): string {
  const flat = raw != null ? flattenMarkdownOrString(raw as MarkdownOrString) : null
  return flat != null && !isEmptyish(flat) ? flat.trim() : ''
}

/** Serialize links array to style-safe JSON string (empty when none). DRY for node and edge links. */
function linksToStyleJson(links: readonly { url: string; title?: string }[] | undefined): string {
  if (!Array.isArray(links) || links.length === 0) return ''
  return encodeURIComponent(JSON.stringify(links.map(l => ({ url: l.url, title: l.title }))))
}

/** Serialize metadata object to style-safe JSON string (empty when none). DRY for edge metadata. */
function metadataToStyleJson(metadata: Record<string, string | string[]> | undefined): string {
  if (
    metadata == null ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata) ||
    Object.keys(metadata).length === 0
  ) {
    return ''
  }
  return encodeURIComponent(JSON.stringify(metadata))
}

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/

/** Build LikeC4 style string (likec4Description=...; etc.) for round-trip. */
function buildLikec4StyleForNode(params: {
  desc: string
  tech: string
  notes: string
  tagList: string
  navTo: string
  iconName: string
  summaryStr: string
  linksJson: string
  borderVal: string | undefined
  containerOpacityNum: number | undefined
  strokeWidth: string
  colorNameForRoundtrip: string
  nodeStyle: { size?: string; padding?: string; textSize?: string; iconPosition?: string } | undefined
  strokeHex: string
  nodeNotation: string | undefined
}): string {
  const parts: string[] = []
  pushStylePart(parts, 'likec4Description', params.desc)
  pushStylePart(parts, 'likec4Technology', params.tech)
  pushStylePart(parts, 'likec4Notes', params.notes)
  pushStylePart(parts, 'likec4Tags', params.tagList)
  pushStylePart(parts, 'likec4NavigateTo', params.navTo)
  pushStylePart(parts, 'likec4Icon', params.iconName)
  pushStylePart(parts, 'likec4Summary', params.summaryStr)
  if (params.linksJson !== '') parts.push(`likec4Links=${params.linksJson}`)
  pushStylePart(parts, 'likec4Border', params.borderVal)
  pushStylePartNum(parts, 'likec4Opacity', params.containerOpacityNum)
  pushStylePart(parts, 'likec4StrokeWidth', params.strokeWidth)
  if (params.colorNameForRoundtrip !== '') parts.push(`likec4ColorName=${params.colorNameForRoundtrip}`)
  pushStylePart(parts, 'likec4Size', params.nodeStyle?.size)
  pushStylePart(parts, 'likec4Padding', params.nodeStyle?.padding)
  pushStylePart(parts, 'likec4TextSize', params.nodeStyle?.textSize)
  pushStylePart(parts, 'likec4IconPosition', params.nodeStyle?.iconPosition)
  if (params.strokeHex && HEX_COLOR_RE.test(params.strokeHex)) {
    pushStylePart(parts, 'likec4StrokeColor', params.strokeHex)
  }
  pushStylePart(parts, 'likec4Notation', params.nodeNotation ?? undefined)
  return parts.length > 0 ? parts.join(';') + ';' : ''
}

/** Build mxUserObject XML from customData for round-trip; returns empty string when customData is missing or empty. */
function buildMxUserObjectXml(customData: Record<string, string> | undefined): string {
  if (
    !customData ||
    typeof customData !== 'object' ||
    Array.isArray(customData) ||
    Object.keys(customData).length === 0
  ) {
    return ''
  }
  return (
    '\n  <mxUserObject>' +
    Object.entries(customData)
      .map(([k, v]) => {
        const safeV = typeof v === 'string' ? v : (v != null ? String(v) : '')
        return `<data key="${escapeXml(k)}">${escapeXml(safeV)}</data>`
      })
      .join('') +
    '</mxUserObject>'
  )
}

/** Build LikeC4 style string for an edge (likec4Description=...; etc.) for round-trip. */
function buildLikec4StyleForEdge(params: {
  edgeDesc: string
  edgeTech: string
  edgeNotes: string
  edgeNavTo: string
  edgeKind: string | undefined
  edgeNotation: string | undefined
  edgeLinksJson: string
  edgeMetadataJson: string
}): string {
  const parts: string[] = []
  pushStylePart(parts, 'likec4Description', params.edgeDesc)
  pushStylePart(parts, 'likec4Technology', params.edgeTech)
  pushStylePart(parts, 'likec4Notes', params.edgeNotes)
  pushStylePart(parts, 'likec4NavigateTo', params.edgeNavTo)
  pushStylePart(parts, 'likec4RelationshipKind', params.edgeKind ?? undefined)
  pushStylePart(parts, 'likec4Notation', params.edgeNotation ?? undefined)
  if (params.edgeLinksJson !== '') parts.push(`likec4Links=${params.edgeLinksJson}`)
  if (params.edgeMetadataJson !== '') parts.push(`likec4Metadata=${params.edgeMetadataJson}`)
  return parts.length > 0 ? parts.join(';') + ';' : ''
}

/** Build a single edge mxCell XML (single responsibility; keeps generateDiagramContent shorter). */
function buildEdgeCellXml(
  edge: Edge,
  layout: DiagramLayoutState,
  options: GenerateDrawioOptions | undefined,
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  getCellId: (nodeId: NodeId) => string,
  edgeCellId: string,
): string {
  const { bboxes, defaultParentId, fontFamily } = layout
  const edgeWaypoints = options?.edgeWaypoints
  const sourceId = getCellId(edge.source)
  const targetId = getCellId(edge.target)
  const sourceBbox = bboxes.get(edge.source)
  const targetBbox = bboxes.get(edge.target)
  const anchors = sourceBbox && targetBbox
    ? edgeAnchors(sourceBbox, targetBbox)
    : { exitX: 1, exitY: 0.5, entryX: 0, entryY: 0.5 }
  const anchorStyle = `exitX=${anchors.exitX};exitY=${anchors.exitY};entryX=${anchors.entryX};entryY=${anchors.entryY};`
  const label = edge.label ? escapeXml(edge.label) : ''
  const strokeColor = getEdgeStrokeColor(viewmodel, edge.color)
  const dashStyle = edge.line === 'dashed'
    ? 'dashed=1;'
    : edge.line === 'dotted'
    ? 'dashed=1;dashPattern=1 1;'
    : ''
  const endArrow = drawioArrow(edge.head)
  const startArrow = edge.tail == null || edge.tail === 'none' ? 'none' : drawioArrow(edge.tail)
  const edgeDesc = toExportString(edge.description)
  const edgeTech = toExportString(edge.technology)
  const edgeNotes = toExportString(edge.notes)
  const edgeNavTo = edge.navigateTo != null && edge.navigateTo !== '' ? String(edge.navigateTo) : ''
  const edgeKind = (edge as Edge & { kind?: string }).kind
  const edgeNotation = (edge as Edge & { notation?: string }).notation
  const edgeLinks = (edge as Edge & { links?: readonly { url: string; title?: string }[] }).links
  const edgeLinksJson = linksToStyleJson(edgeLinks)
  const edgeMetadata = (edge as Edge & { metadata?: Record<string, string | string[]> }).metadata
  const edgeMetadataJson = metadataToStyleJson(edgeMetadata)
  const edgeLikec4Style = buildLikec4StyleForEdge({
    edgeDesc,
    edgeTech,
    edgeNotes,
    edgeNavTo,
    edgeKind,
    edgeNotation,
    edgeLinksJson,
    edgeMetadataJson,
  })
  const edgeCustomData = (edge as Edge & { customData?: Record<string, string> }).customData
  const edgeUserObjectXml = buildMxUserObjectXml(edgeCustomData)
  const rawEdgePoints = edgeWaypoints?.[`${edge.source}|${edge.target}|${edge.id}`] ??
    edgeWaypoints?.[`${edge.source}|${edge.target}`]
  const edgePoints: [number, number][] = Array.isArray(rawEdgePoints)
    ? rawEdgePoints.flatMap(normalizeEdgePoint)
    : []
  const hasPoints = edgePoints.length > 0
  const pointsXml = hasPoints
    ? '<Array as="points">' +
      edgePoints
        .map(([px, py]) => `<mxPoint x="${Math.round(px)}" y="${Math.round(py)}"/>`)
        .join('') +
      '</Array>'
    : ''
  const edgeGeometryXml = hasPoints
    ? `<mxGeometry relative="0" as="geometry">${pointsXml}</mxGeometry>`
    : '<mxGeometry relative="1" as="geometry" />'
  const edgeLabelColors = getEdgeLabelColors(viewmodel, edge.color)
  const edgeLabelStyle = label === ''
    ? ''
    : `fontColor=${edgeLabelColors.font};fontSize=12;align=center;verticalAlign=middle;labelBackgroundColor=none;fontFamily=${
      encodeURIComponent(fontFamily)
    };`
  return `<mxCell id="${edgeCellId}" value="${label}" style="endArrow=${endArrow};startArrow=${startArrow};html=1;rounded=0;${anchorStyle}strokeColor=${strokeColor};strokeWidth=2;${dashStyle}${edgeLabelStyle}${edgeLikec4Style}" edge="1" parent="${defaultParentId}" source="${sourceId}" target="${targetId}">
  ${edgeGeometryXml}${edgeUserObjectXml}
</mxCell>`
}

/** Result of building one node's cell(s): vertex XML and optional container title cell (single responsibility). */
type NodeCellResult = { vertexXml: string; titleCellXml?: string; isContainer: boolean }

/** Build one node's vertex mxCell XML (and optional container title cell) so generateDiagramContent stays short. */
function buildNodeCellXml(
  node: Node,
  layout: DiagramLayoutState,
  options: GenerateDrawioOptions | undefined,
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  getCellId: (nodeId: NodeId) => string,
  containerTitleCellId: number,
): NodeCellResult {
  const {
    bboxes,
    containerNodeIds,
    defaultParentId,
    nodeIdsInView,
    effectiveStyles,
    fontFamily,
    containerTitleFontSizePx,
    containerTitleColor,
  } = layout
  const strokeColorByNodeId = options?.strokeColorByNodeId
  const strokeWidthByNodeId = options?.strokeWidthByNodeId

  const id = getCellId(node.id)
  const bbox = bboxes.get(node.id)!
  const { width, height } = bbox
  const parentId = node.parent != null && nodeIdsInView.has(node.parent)
    ? getCellId(node.parent)
    : defaultParentId
  const parentBbox = node.parent != null ? bboxes.get(node.parent) : undefined
  const x = parentBbox == null ? bbox.x + layout.offsetX : bbox.x - parentBbox.x
  const y = parentBbox == null ? bbox.y + layout.offsetY : bbox.y - parentBbox.y

  const title = node.title
  const desc = toExportString(node.description)
  const tech = toExportString(node.technology)
  const notes = toExportString((node as Node & { notes?: MarkdownOrString }).notes)
  const tags = (node as Node & { tags?: readonly string[] }).tags
  const tagList = Array.isArray(tags) && tags.length > 0 ? tags.join(',') : ''
  const navigateTo = (node as Node & { navigateTo?: string | null }).navigateTo
  const navTo = navigateTo != null && navigateTo !== '' ? String(navigateTo) : ''
  const icon = (node as Node & { icon?: string | null }).icon
  const iconName = icon != null && icon !== '' ? String(icon) : ''

  const isContainer = containerNodeIds.has(node.id)
  const shapeStyle = isContainer
    ? 'shape=rectangle;rounded=0;container=1;collapsible=0;startSize=0;'
    : drawioShape(node.shape)
  const strokeColorOverride = strokeColorByNodeId?.[node.id]
  const strokeWidthOverride = strokeWidthByNodeId?.[node.id]
  const elemColors = strokeColorOverride
    ? ((): ElementColors => {
      const base = getElementColors(viewmodel, node.color)
      return {
        fill: base?.fill ?? DEFAULT_NODE_FILL_HEX,
        stroke: strokeColorOverride,
        font: base?.font ?? strokeColorOverride,
      }
    })()
    : getElementColors(viewmodel, node.color)
  const fillHex = elemColors?.fill ?? DEFAULT_NODE_FILL_HEX
  const strokeHex = elemColors?.stroke ?? DEFAULT_NODE_STROKE_HEX
  const fontHex = elemColors?.font ?? elemColors?.stroke ?? DEFAULT_NODE_FONT_HEX
  const colorStyle = `fillColor=${fillHex};strokeColor=${strokeHex};fontColor=${fontHex};`
  const nodeStyle = node.style as {
    border?: string
    opacity?: number
    size?: string
    padding?: string
    textSize?: TextSize
    iconPosition?: string
  } | undefined
  const fontSizePx = effectiveStyles.fontSize(nodeStyle?.textSize)
  const valueHtml = buildNodeValueHtml(title, desc, isContainer, fontHex, fontFamily, fontSizePx)
  const value = escapeXml(valueHtml)
  const borderVal = nodeStyle?.border
  const strokeWidthDefault = borderVal === 'none' ? '0' : (isContainer ? '1' : (borderVal ? '1' : ''))
  const strokeWidth = strokeWidthOverride ?? strokeWidthDefault
  const strokeWidthStyle = strokeWidth !== '' ? `strokeWidth=${strokeWidth};` : ''
  let containerDashed: string
  if (isContainer && borderVal !== 'none') containerDashed = 'dashed=1;'
  else if (borderVal === 'dashed') containerDashed = 'dashed=1;'
  else containerDashed = ''
  const containerOpacityNum = isContainer === true ? (nodeStyle?.opacity ?? 15) : undefined
  const fillOpacityStyle = containerOpacityNum != null && isContainer === true
    ? `fillOpacity=${Math.min(100, Math.max(0, containerOpacityNum))};`
    : ''
  const summaryStr = toExportString((node as Node & { summary?: MarkdownOrString }).summary)
  const links = (node as Node & { links?: readonly { url: string; title?: string }[] }).links
  const linksJson = linksToStyleJson(links)
  const opacityStyle = fillOpacityStyle
  const colorNameForRoundtrip = node.color ? encodeURIComponent(String(node.color)) : ''

  const nodeNotation = (node as Node & { notation?: string }).notation
  const likec4Style = buildLikec4StyleForNode({
    desc,
    tech,
    notes,
    tagList,
    navTo,
    iconName,
    summaryStr,
    linksJson,
    borderVal,
    containerOpacityNum,
    strokeWidth,
    colorNameForRoundtrip,
    nodeStyle,
    strokeHex,
    nodeNotation,
  })

  const nodeCustomData = (node as Node & { customData?: Record<string, string> }).customData
  const userObjectXml = buildMxUserObjectXml(nodeCustomData)

  const navLinkStyle = buildNavLinkStyle(navTo)
  const vertexTextStyle = isContainer
    ? 'align=left;verticalAlign=top;overflow=fill;whiteSpace=wrap;html=1;'
    : `align=center;verticalAlign=middle;verticalLabelPosition=middle;labelPosition=center;fontSize=${fontSizePx};fontStyle=1;spacingTop=4;spacingLeft=2;spacingRight=2;spacingBottom=2;overflow=fill;whiteSpace=wrap;html=1;fontFamily=${
      encodeURIComponent(fontFamily)
    };`

  const userObjectLabel = isContainer ? escapeXml(title) : value
  const styleStr =
    `${vertexTextStyle}${shapeStyle}${colorStyle}${strokeWidthStyle}${containerDashed}${opacityStyle}${navLinkStyle}${likec4Style}html=1;`
  const geometryLine = `<mxGeometry height="${Math.round(height)}" width="${Math.round(width)}" x="${
    Math.round(x)
  }" y="${Math.round(y)}" as="geometry" />${userObjectXml}`
  const cellXml = navTo === ''
    ? `<mxCell id="${id}" value="${value}" style="${styleStr}" vertex="1" parent="${parentId}">\n  ${geometryLine}\n</mxCell>`
    : `<UserObject label="${userObjectLabel}" link="${DRAWIO_PAGE_LINK_PREFIX}${
      escapeXml(navTo)
    }" id="${id}">\n  <mxCell parent="${parentId}" style="${styleStr}" value="${value}" vertex="1">\n  ${geometryLine}\n</mxCell>\n</UserObject>`

  if (!isContainer) return { vertexXml: cellXml, isContainer: false }

  const titleId = String(containerTitleCellId)
  const titleCellXml = buildContainerTitleCellXml(
    title,
    titleId,
    navTo,
    id,
    fontFamily,
    containerTitleFontSizePx,
    containerTitleColor,
  )
  return { vertexXml: cellXml, titleCellXml, isContainer: true }
}

/** Build container title cell XML (child of container, relative position CONTAINER_TITLE_INSET_*). */
function buildContainerTitleCellXml(
  title: string,
  titleId: string,
  navTo: string,
  containerId: string,
  fontFamily: string,
  fontSizePx: number,
  colorHex: string,
): string {
  const titleValue = escapeXml(title)
  const titleWidth = Math.max(
    CONTAINER_TITLE_MIN_WIDTH_PX,
    Math.min(CONTAINER_TITLE_MAX_WIDTH_PX, title.length * CONTAINER_TITLE_CHAR_WIDTH_PX),
  )
  const titleHeight = CONTAINER_TITLE_HEIGHT_PX
  const titleX = CONTAINER_TITLE_INSET_X
  const titleY = CONTAINER_TITLE_INSET_Y
  const navLinkStyle = buildNavLinkStyle(navTo)
  const titleStyle =
    `shape=text;html=1;fillColor=none;strokeColor=none;align=left;verticalAlign=top;fontSize=${fontSizePx};fontStyle=1;fontColor=${colorHex};fontFamily=${
      encodeURIComponent(fontFamily)
    };${navLinkStyle}`
  const titleInner =
    `<mxCell parent="${containerId}" style="${titleStyle}" value="${titleValue}" vertex="1">\n  <mxGeometry x="${
      Math.round(titleX)
    }" y="${Math.round(titleY)}" width="${titleWidth}" height="${titleHeight}" as="geometry" />\n</mxCell>`
  if (navTo === '') {
    return `<mxCell id="${titleId}" value="${titleValue}" style="${titleStyle}" vertex="1" parent="${containerId}">\n  <mxGeometry x="${
      Math.round(titleX)
    }" y="${Math.round(titleY)}" width="${titleWidth}" height="${titleHeight}" as="geometry" />\n</mxCell>`
  }
  return `<UserObject label="${escapeXml(title)}" link="${DRAWIO_PAGE_LINK_PREFIX}${
    escapeXml(navTo)
  }" id="${titleId}">\n  ${titleInner}\n</UserObject>`
}

/** View title for diagram name and root cell (single source of truth). */
function getViewTitle(view: View): string | null {
  return typeof (view as { title?: string | null }).title === 'string'
    ? (view as { title: string }).title
    : null
}

/** Normalize view description from txt/md/string to plain string (single responsibility). */
function getViewDescriptionString(view: View): string {
  const raw = (view as { description?: unknown }).description
  if (raw != null && typeof raw === 'object' && 'txt' in raw) return String((raw as { txt: string }).txt)
  if (raw != null && typeof raw === 'object' && 'md' in raw) return String((raw as { md: string }).md)
  if (typeof raw === 'string') return raw
  return ''
}

/** Build root cell style string from view metadata (title, description, notation) for round-trip. */
function buildRootCellStyle(view: View): string {
  const viewTitle = getViewTitle(view)
  const viewDesc = getViewDescriptionString(view)
  const viewDescEnc = viewDesc.trim() !== '' ? encodeURIComponent(viewDesc.trim()) : ''
  const viewNotationRaw = (view as unknown as { notation?: unknown }).notation
  const viewNotation = typeof viewNotationRaw === 'string' && viewNotationRaw !== '' ? viewNotationRaw : undefined
  const viewNotationEnc = viewNotation != null ? encodeURIComponent(viewNotation) : ''
  const rootParts = [
    'rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;',
    `likec4ViewTitle=${encodeURIComponent(viewTitle ?? view.id)};`,
    viewDescEnc !== '' ? `likec4ViewDescription=${viewDescEnc};` : '',
    viewNotationEnc !== '' ? `likec4ViewNotation=${viewNotationEnc};` : '',
  ]
  return rootParts.join('')
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
  /** Edge waypoints: key "source|target" or "source|target|edgeId" (FQN, optional id for parallel edges), value = [x,y][] (e.g. from likec4.edge.waypoints comment) */
  edgeWaypoints?: Record<string, number[][]>
  /** If false, embed raw mxGraphModel XML inside <diagram> (no base64/deflate). Draw.io accepts both. */
  compressed?: boolean
}

/** Result of layout phase: bboxes, offsets, and shared styling so cell-building phase stays readable. */
type DiagramLayoutState = {
  view: View
  bboxes: Map<NodeId, BBox>
  containerNodeIds: Set<NodeId>
  sortedNodes: Node[]
  offsetX: number
  offsetY: number
  canvasWidth: number
  canvasHeight: number
  defaultParentId: string
  rootId: string
  effectiveStyles: LikeC4Styles
  fontFamily: string
  containerTitleFontSizePx: number
  containerTitleColor: string
  nodeIdsInView: Set<NodeId>
}

const DEFAULT_BBOX: BBox = {
  x: 0,
  y: 0,
  width: DEFAULT_NODE_WIDTH,
  height: DEFAULT_NODE_HEIGHT,
}

function isDefaultBbox(b: BBox): boolean {
  return (
    b.x === DEFAULT_BBOX.x &&
    b.y === DEFAULT_BBOX.y &&
    b.width === DEFAULT_BBOX.width &&
    b.height === DEFAULT_BBOX.height
  )
}

/** Spread nodes that share the same default bbox vertically so they don't overlap (single responsibility). */
function spreadUnlaidNodesOverVertical(
  bboxes: Map<NodeId, BBox>,
  sortedNodes: Node[],
  containerNodeIds: Set<NodeId>,
): void {
  const bboxKey = (b: BBox) => `${b.x},${b.y},${b.width},${b.height}`
  const nonContainerNodes = sortedNodes.filter(n => !containerNodeIds.has(n.id))
  const byBbox = new Map<string, Node[]>()
  for (const n of nonContainerNodes) {
    const b = bboxes.get(n.id)
    if (!b) continue
    const key = bboxKey(b)
    const list = byBbox.get(key) ?? []
    list.push(n)
    byBbox.set(key, list)
  }
  for (const bboxNodes of byBbox.values()) {
    if (bboxNodes.length <= 1) continue
    const firstNode = bboxNodes[0]
    const firstBbox = firstNode ? bboxes.get(firstNode.id) : undefined
    if (firstBbox && isDefaultBbox(firstBbox)) {
      bboxNodes.forEach((node, i) => {
        bboxes.set(node.id, {
          ...firstBbox,
          x: firstBbox.x,
          y: firstBbox.y + i * (firstBbox.height + NODES_SPREAD_GAP),
        })
      })
    }
  }
}

/** Wrap container bboxes around children when container has default bbox (single responsibility). */
function computeContainerBboxesFromChildren(
  bboxes: Map<NodeId, BBox>,
  containerNodeIds: Set<NodeId>,
  sortedNodes: Node[],
  nodeIdsInView: Set<NodeId>,
  containerPadding: number,
  containerPaddingVertical: number,
): void {
  const containerNodesSorted = [...sortedNodes]
    .filter(n => containerNodeIds.has(n.id))
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
  for (const node of containerNodesSorted) {
    const children = (node as Node & { children?: NodeId[] }).children ?? []
    const inView = children.filter((id: NodeId) => nodeIdsInView.has(id))
    if (inView.length === 0) continue
    const initialBbox = bboxes.get(node.id)!
    if (!isDefaultBbox(initialBbox)) continue
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
        x: minX - containerPadding,
        y: minY - containerPaddingVertical,
        width: maxX - minX + 2 * containerPadding,
        height: maxY - minY + 2 * containerPaddingVertical,
      })
    }
  }
}

/** Compute canvas offsets to center content (single responsibility). */
function computeContentBoundsAndOffsets(bboxes: Map<NodeId, BBox>): {
  offsetX: number
  offsetY: number
  canvasWidth: number
  canvasHeight: number
} {
  let contentMinX = Infinity,
    contentMinY = Infinity,
    contentMaxX = -Infinity,
    contentMaxY = -Infinity
  for (const b of bboxes.values()) {
    contentMinX = Math.min(contentMinX, b.x)
    contentMinY = Math.min(contentMinY, b.y)
    contentMaxX = Math.max(contentMaxX, b.x + b.width)
    contentMaxY = Math.max(contentMaxY, b.y + b.height)
  }
  if (contentMinX === Infinity) contentMinX = 0
  if (contentMinY === Infinity) contentMinY = 0
  if (contentMaxX === -Infinity) contentMaxX = contentMinX + DEFAULT_CANVAS_WIDTH
  if (contentMaxY === -Infinity) contentMaxY = contentMinY + DEFAULT_CANVAS_HEIGHT
  const contentCx = contentMinX + (contentMaxX - contentMinX) / 2
  const contentCy = contentMinY + (contentMaxY - contentMinY) / 2
  return {
    offsetX: DEFAULT_CANVAS_WIDTH / 2 - contentCx,
    offsetY: DEFAULT_CANVAS_HEIGHT / 2 - contentCy,
    canvasWidth: DEFAULT_CANVAS_WIDTH,
    canvasHeight: DEFAULT_CANVAS_HEIGHT,
  }
}

/**
 * Layout phase: compute bboxes, container wrap, content bounds, and offsets.
 * Delegates to spreadUnlaidNodesOverVertical, computeContainerBboxesFromChildren, computeContentBoundsAndOffsets.
 */
function computeDiagramLayout(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  options?: GenerateDrawioOptions,
): DiagramLayoutState {
  const view = viewmodel.$view
  const { nodes } = view
  const layoutOverride = options?.layoutOverride

  const sortedNodes = [...nodes].sort((a, b) => {
    if (isNil(a.parent) && isNil(b.parent)) return 0
    if (isNil(a.parent)) return -1
    if (isNil(b.parent)) return 1
    if (a.parent === b.parent) return 0
    if (a.id.startsWith(b.id + '.')) return 1
    if (b.id.startsWith(a.id + '.')) return -1
    return 0
  })

  const getBBox = (n: View['nodes'][number]): BBox => {
    const over = layoutOverride?.[n.id]
    if (over) return over
    const d = n as DiagramNode & { position?: [number, number]; size?: { width: number; height: number } }
    const x = typeof d.x === 'number' ? d.x : (Array.isArray(d.position) ? d.position[0] : 0)
    const y = typeof d.y === 'number' ? d.y : (Array.isArray(d.position) ? d.position[1] : 0)
    const width = typeof d.width === 'number' ? d.width : (d.size?.width ?? DEFAULT_NODE_WIDTH)
    const height = typeof d.height === 'number' ? d.height : (d.size?.height ?? DEFAULT_NODE_HEIGHT)
    return { x, y, width, height }
  }

  const bboxes = new Map<NodeId, BBox>()
  for (const node of sortedNodes) bboxes.set(node.id, getBBox(node))

  const nodeIdsInView = new Set<NodeId>((nodes as Node[]).map(n => n.id))
  const containerNodeIds = new Set(
    (nodes as Node[]).filter(
      n =>
        Array.isArray(n.children) &&
        n.children.some((childId: NodeId) => nodeIdsInView.has(childId)),
    ).map(n => n.id),
  )

  spreadUnlaidNodesOverVertical(bboxes, sortedNodes, containerNodeIds)

  const effectiveStyles = getEffectiveStyles(viewmodel)
  const containerPadding = effectiveStyles.theme.spacing.xl
  const containerPaddingVertical = effectiveStyles.theme.spacing.xl + effectiveStyles.theme.spacing.md
  computeContainerBboxesFromChildren(
    bboxes,
    containerNodeIds,
    sortedNodes,
    nodeIdsInView,
    containerPadding,
    containerPaddingVertical,
  )

  const { offsetX, offsetY, canvasWidth, canvasHeight } = computeContentBoundsAndOffsets(bboxes)

  return {
    view,
    bboxes,
    containerNodeIds,
    sortedNodes,
    offsetX,
    offsetY,
    canvasWidth,
    canvasHeight,
    defaultParentId: '1',
    rootId: '0',
    effectiveStyles,
    fontFamily: LIKEC4_FONT_FAMILY,
    containerTitleFontSizePx: Math.round(effectiveStyles.theme.textSizes.xs),
    containerTitleColor: CONTAINER_TITLE_COLOR,
    nodeIdsInView,
  }
}

/**
 * Generate DrawIO (mxGraph) XML from a layouted LikeC4 view.
 * Preserves positions, hierarchy, colors, descriptions and technology so the diagram
 * can be opened and edited in draw.io with full compatibility.
 *
 * @param viewmodel - Layouted LikeC4 view model (from model.view(id))
 * @param options - Optional overrides for layout/colors (round-trip from comment blocks)
 * @returns Diagram name, id and content (for single or multi composition)
 */
function generateDiagramContent(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  options?: GenerateDrawioOptions,
): { name: string; id: string; content: string } {
  const view = viewmodel.$view
  const { edges } = view
  const strokeColorByNodeId = options?.strokeColorByNodeId
  const strokeWidthByNodeId = options?.strokeWidthByNodeId
  const edgeWaypoints = options?.edgeWaypoints
  const useCompressed = options?.compressed !== false

  const layout = computeDiagramLayout(viewmodel, options)
  const { sortedNodes, defaultParentId, rootId, canvasWidth, canvasHeight } = layout

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
  let containerTitleCellId = CONTAINER_TITLE_CELL_ID_START

  for (const node of sortedNodes) {
    const result = buildNodeCellXml(
      node,
      layout,
      options,
      viewmodel,
      getCellId,
      containerTitleCellId,
    )
    if (result.isContainer) {
      containerCells.push(result.vertexXml)
      if (result.titleCellXml) containerCells.push(result.titleCellXml)
      containerTitleCellId++
    } else {
      vertexCells.push(result.vertexXml)
    }
  }

  for (const edge of edges as Edge[]) {
    const edgeId = String(cellId++)
    edgeCells.push(
      buildEdgeCellXml(edge, layout, options, viewmodel, getCellId, edgeId),
    )
  }

  const rootCellStyle = buildRootCellStyle(view)

  const allCells = [
    `<mxCell id="${defaultParentId}" value="" style="${rootCellStyle}" vertex="1" parent="${rootId}">
  <mxGeometry x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" as="geometry" />
</mxCell>`,
    ...containerCells,
    ...vertexCells,
    ...edgeCells,
  ].join('\n')

  const diagramName = (getViewTitle(view) ?? view.id).trim() || view.id
  const mxGraphModelXml =
    `<mxGraphModel dx="800" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${MXGRAPH_PAGE_WIDTH}" pageHeight="${MXGRAPH_PAGE_HEIGHT}" math="0" shadow="0">
      <root>
        <mxCell id="${rootId}" />
        ${allCells}
      </root>
    </mxGraphModel>`
  const content = useCompressed
    ? compressDrawioDiagramXml(mxGraphModelXml)
    : mxGraphModelXml
  return { name: diagramName, id: view.id, content }
}

/** Wrap one or more diagram contents in mxfile XML. */
function wrapInMxFile(diagrams: Array<{ name: string; id: string; content: string }>): string {
  if (diagrams.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
</mxfile>
`
  }
  const pagesAttr = diagrams.length > 1 ? ` pages="${diagrams.length}"` : ''
  const diagramParts = diagrams.map(
    d =>
      `  <diagram name="${escapeXml(d.name)}" id="${DRAWIO_DIAGRAM_ID_PREFIX}${
        escapeXml(d.id)
      }">${d.content}</diagram>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${
    new Date().toISOString()
  }" agent="LikeC4" version="1.0" etag="" type="device"${pagesAttr}>
${diagramParts.join('\n')}
</mxfile>
`
}

/**
 * Generate a single DrawIO file from one view.
 *
 * @param viewmodel - Layouted LikeC4 view model (from model.view(id))
 * @param options - Optional overrides for layout/colors (round-trip from comment blocks)
 * @returns DrawIO .drawio XML string
 */
export function generateDrawio(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  options?: GenerateDrawioOptions,
): string {
  return wrapInMxFile([generateDiagramContent(viewmodel, options)])
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
  const diagrams = viewmodels.map(vm => generateDiagramContent(vm, optionsByViewId?.[vm.$view.id]))
  return wrapInMxFile(diagrams)
}

/**
 * Build export options from .c4 source round-trip comment blocks (layout, strokes, waypoints).
 * Shared by CLI and playground so options are built in one place (DRY).
 *
 * @param viewId - View id for layoutOverride lookup
 * @param sourceContent - Full .c4 source (e.g. joined workspace files)
 * @param overrides - Optional overrides (e.g. compressed: false)
 */
export function buildDrawioExportOptionsFromSource(
  viewId: string,
  sourceContent: string | undefined,
  overrides?: Partial<GenerateDrawioOptions>,
): GenerateDrawioOptions {
  const options: GenerateDrawioOptions = { compressed: false, ...overrides }
  if (!sourceContent) return options
  const roundtrip = parseDrawioRoundtripComments(sourceContent)
  if (!roundtrip) return options
  const layoutForView = roundtrip.layoutByView[viewId]?.nodes
  if (layoutForView != null) options.layoutOverride = layoutForView
  if (Object.keys(roundtrip.strokeColorByFqn).length > 0) {
    options.strokeColorByNodeId = roundtrip.strokeColorByFqn
  }
  if (Object.keys(roundtrip.strokeWidthByFqn).length > 0) {
    options.strokeWidthByNodeId = roundtrip.strokeWidthByFqn
  }
  if (Object.keys(roundtrip.edgeWaypoints).length > 0) {
    options.edgeWaypoints = roundtrip.edgeWaypoints
  }
  return options
}
