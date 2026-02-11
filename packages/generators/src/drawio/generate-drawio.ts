import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, DiagramNode, NodeId, ProcessedView } from '@likec4/core/types'
import type { MarkdownOrString } from '@likec4/core/types'
import { flattenMarkdownOrString } from '@likec4/core/types'
import pako from 'pako'
import { isEmptyish, isNullish as isNil } from 'remeda'

/** DrawIO expects diagram content as base64(deflateRaw(encodeURIComponent(xml))). */
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

/** Default hex colors when view model has no $styles (e.g. in tests). Aligns with common theme colors. */
const DEFAULT_ELEMENT_COLORS: Record<string, { fill: string; stroke: string }> = {
  primary: { fill: '#3b82f6', stroke: '#2563eb' },
  gray: { fill: '#6b7280', stroke: '#4b5563' },
  green: { fill: '#22c55e', stroke: '#16a34a' },
  red: { fill: '#ef4444', stroke: '#dc2626' },
  blue: { fill: '#3b82f6', stroke: '#2563eb' },
  indigo: { fill: '#6366f1', stroke: '#4f46e5' },
  muted: { fill: '#9ca3af', stroke: '#6b7280' },
}

const DEFAULT_EDGE_COLOR = '#6b7280'

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

/**
 * Map LikeC4 shape to DrawIO style. DrawIO uses shape=rectangle, ellipse, cylinder, etc.
 * LikeC4 default rectangles have slightly rounded corners (rounded=1).
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

function getElementColors(
  viewmodel: LikeC4ViewModel<aux.Unknown>,
  color: string,
): { fill: string; stroke: string } | undefined {
  const styles = '$styles' in viewmodel && viewmodel.$styles ? viewmodel.$styles : null
  if (styles) {
    try {
      const values = styles.colors(color)
      return {
        fill: values.elements.fill as string,
        stroke: values.elements.stroke as string,
      }
    } catch {
      // custom color or missing
    }
  }
  return DEFAULT_ELEMENT_COLORS[color] ?? DEFAULT_ELEMENT_COLORS['primary']
}

function getEdgeStrokeColor(viewmodel: LikeC4ViewModel<aux.Unknown>, color: string): string {
  const styles = '$styles' in viewmodel && viewmodel.$styles ? viewmodel.$styles : null
  if (styles) {
    try {
      const values = styles.colors(color)
      return values.relationships.line as string
    } catch {
      // custom color or missing
    }
  }
  return DEFAULT_EDGE_COLOR
}

/** Map LikeC4 RelationshipArrowType to draw.io endArrow/startArrow style value. */
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
  /** Node id -> { x, y, width, height } to use instead of viewmodel layout */
  layoutOverride?: Record<string, { x: number; y: number; width: number; height: number }>
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

  /** Support both BBox (x,y,width,height), legacy position/size, and layoutOverride for round-trip */
  const getBBox = (n: View['nodes'][number]) => {
    const over = layoutOverride?.[n.id]
    if (over) return { x: over.x, y: over.y, width: over.width, height: over.height }
    const d = n as DiagramNode & { position?: [number, number]; size?: { width: number; height: number } }
    const x = typeof d.x === 'number' ? d.x : (Array.isArray(d.position) ? d.position[0] : 0)
    const y = typeof d.y === 'number' ? d.y : (Array.isArray(d.position) ? d.position[1] : 0)
    const width = typeof d.width === 'number' ? d.width : (d.size?.width ?? 120)
    const height = typeof d.height === 'number' ? d.height : (d.size?.height ?? 60)
    return { x, y, width, height }
  }

  const bboxes = new Map<NodeId, { x: number; y: number; width: number; height: number }>()
  for (const node of sortedNodes) bboxes.set(node.id, getBBox(node))

  /** Node ids that have children: export as DrawIO containers (bounded context) with dashed border and fill opacity. */
  const containerNodeIds = new Set(
    (nodes as Node[]).filter(n => n.children && n.children.length > 0).map(n => n.id),
  )

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
  let pageBounds: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  }
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

    const valueHtml = desc !== ''
      ? `<b>${escapeHtml(title)}</b><br/><span style="font-weight: normal; font-size: 11px;">${escapeHtml(desc)}</span>`
      : escapeHtml(title)
    const value = escapeXml(valueHtml)

    const isContainer = containerNodeIds.has(node.id)
    const shapeStyle = isContainer
      ? 'shape=rectangle;rounded=0;container=1;'
      : drawioShape(node.shape)
    const strokeColorOverride = strokeColorByNodeId?.[node.id]
    const strokeWidthOverride = strokeWidthByNodeId?.[node.id]
    const elemColors = strokeColorOverride
      ? { fill: getElementColors(viewmodel, node.color)?.fill ?? '#dae8fc', stroke: strokeColorOverride }
      : getElementColors(viewmodel, node.color)
    const colorStyle = elemColors != null
      ? `fillColor=${elemColors.fill};strokeColor=${elemColors.stroke};fontColor=${elemColors.stroke};`
      : ''
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
    const containerOpacityNum = isContainer ? (nodeStyle?.opacity ?? 15) : null
    const fillOpacityStyle = containerOpacityNum != null
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
    const opacityVal = nodeStyle?.opacity
    const opacityStyle = fillOpacityStyle || (typeof opacityVal === 'number' && opacityVal >= 0 && opacityVal <= 100
      ? `opacity=${opacityVal};`
      : '')
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
    if (elemColors?.stroke && /^#[0-9A-Fa-f]{3,8}$/.test(elemColors.stroke)) {
      likec4Extra.push(`likec4StrokeColor=${encodeURIComponent(elemColors.stroke)}`)
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
    const fontSizeStyle = 'fontSize=12;'

    vertexCells.push(
      `<mxCell id="${id}" value="${value}" style="${shapeStyle}${colorStyle}${strokeWidthStyle}${containerDashed}${opacityStyle}${fontSizeStyle}${navLinkStyle}${likec4Style}html=1;whiteSpace=wrap;verticalAlign=middle;align=center;verticalLabelPosition=middle;labelPosition=center;spacingTop=4;overflow=fill;spacingLeft=2;spacingRight=2;spacingBottom=2;fontStyle=1;" vertex="1" parent="${parentId}">
  <mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${
        Math.round(height)
      }" as="geometry" />${userObjectXml}
</mxCell>`,
    )
  }

  for (const edge of edges as Edge[]) {
    const id = String(cellId++)
    const sourceId = getCellId(edge.source)
    const targetId = getCellId(edge.target)
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
      ? rawEdgePoints.flatMap(pt =>
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
      ? '<Array>' +
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

    edgeCells.push(
      `<mxCell id="${id}" value="${label}" style="endArrow=${endArrow};startArrow=${startArrow};html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;strokeColor=${strokeColor};${dashStyle}${edgeLikec4Style}" edge="1" parent="${defaultParentId}" source="${sourceId}" target="${targetId}">
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
    'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#ffffff;',
    `likec4ViewTitle=${encodeURIComponent(viewTitle ?? view.id)};`,
    viewDescEnc !== '' ? `likec4ViewDescription=${viewDescEnc};` : '',
    viewNotationEnc !== '' ? `likec4ViewNotation=${viewNotationEnc};` : '',
  ]
  const rootCellStyle = rootParts.join('')

  const allCells = [
    `<mxCell id="${defaultParentId}" value="" style="${rootCellStyle}" vertex="1" parent="${rootId}">
  <mxGeometry x="${pageBounds.x}" y="${pageBounds.y}" width="${pageBounds.width}" height="${pageBounds.height}" as="geometry" />
</mxCell>`,
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
 * @returns DrawIO .drawio XML string with multiple <diagram> elements
 */
export function generateDrawioMulti(
  viewmodels: Array<LikeC4ViewModel<aux.Unknown>>,
): string {
  if (viewmodels.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
</mxfile>
`
  }
  if (viewmodels.length === 1) {
    return generateDrawio(viewmodels[0]!)
  }
  const diagramParts = viewmodels.map(vm => {
    const single = generateDrawio(vm)
    const m = single.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/)
    const view = vm.$view
    if (!m) return ''
    const diagramName = (typeof (view as { title?: string | null }).title === 'string'
      ? (view as { title: string }).title
      : null) ?? view.id
    return `  <diagram name="${escapeXml(diagramName)}" id="likec4-${escapeXml(view.id)}">${m[1]}</diagram>`
  }).filter(Boolean)
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
${diagramParts.join('\n')}
</mxfile>
`
}
