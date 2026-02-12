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
  let containerTitleCellId = 10000

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
        n.children.some((childId: NodeId) => nodeIdsInView.has(childId)),
    ).map(n => n.id),
  )

  /** When multiple non-container nodes share the same bbox only apply spread when it's the default (no layout), so we don't alter real diagram positions. */
  const DEFAULT_BBOX: BBox = { x: 0, y: 0, width: 120, height: 60 }
  const isDefaultBbox = (b: BBox) =>
    b.x === DEFAULT_BBOX.x &&
    b.y === DEFAULT_BBOX.y &&
    b.width === DEFAULT_BBOX.width &&
    b.height === DEFAULT_BBOX.height
  const GAP = 24
  const bboxKey = (b: BBox) => `${b.x},${b.y},${b.width},${b.height}`
  const nonContainerNodes = sortedNodes.filter(n => !containerNodeIds.has(n.id))
  const byBbox = new Map<string, typeof nonContainerNodes>()
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
          y: firstBbox.y + i * (firstBbox.height + GAP),
        })
      })
    }
  }

  const effectiveStyles = getEffectiveStyles(viewmodel)
  /** Margins between container wrapper and children: horizontal = xl, vertical = xl + md (vertical slightly larger). */
  const CONTAINER_PADDING = effectiveStyles.theme.spacing.xl
  const CONTAINER_PADDING_VERTICAL = effectiveStyles.theme.spacing.xl + effectiveStyles.theme.spacing.md

  const containerNodesSorted = [...sortedNodes]
    .filter(n => containerNodeIds.has(n.id))
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
  for (const node of containerNodesSorted) {
    const children = (node as Node & { children?: NodeId[] }).children ?? []
    const inView = children.filter((id: NodeId) => nodeIdsInView.has(id))
    if (inView.length === 0) continue
    const initialBbox = bboxes.get(node.id)!
    /** Use layout bbox when the diagram provides one; only wrap children when container has default bbox (no layout). */
    if (isDefaultBbox(initialBbox)) {
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
          y: minY - CONTAINER_PADDING_VERTICAL,
          width: maxX - minX + 2 * CONTAINER_PADDING,
          height: maxY - minY + 2 * CONTAINER_PADDING_VERTICAL,
        })
      }
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
  /** Use fixed canvas size for centering so the diagram always opens centered in Draw.io (layout bounds often equal content bounds, which would give offset 0 and top-left placement). */
  const canvasWidth = 800
  const canvasHeight = 600
  const offsetX = canvasWidth / 2 - contentCx
  const offsetY = canvasHeight / 2 - contentCy

  /** LikeC4 app font (matches --mantine-font-family / --likec4-app-font-default). */
  const fontFamily = '\'IBM Plex Sans Variable\',ui-sans-serif,system-ui,sans-serif'
  /** Container title color: matches LikeC4 diagram compound title (same as in diagram UI). */
  const containerTitleColor = '#74c0fc'
  const containerTitleFontSizePx = Math.round(effectiveStyles.theme.textSizes.xs)

  for (const node of sortedNodes) {
    const id = getCellId(node.id)
    const bbox = bboxes.get(node.id)!
    const { width, height } = bbox
    const parentId = node.parent != null && nodeIdsInView.has(node.parent)
      ? getCellId(node.parent)
      : defaultParentId
    const parentBbox = node.parent != null ? bboxes.get(node.parent) : undefined
    const x = parentBbox == null ? bbox.x + offsetX : bbox.x - parentBbox.x
    const y = parentBbox == null ? bbox.y + offsetY : bbox.y - parentBbox.y

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
      ? 'shape=rectangle;rounded=0;container=1;collapsible=0;startSize=0;'
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
    const nodeStyle = node.style as {
      border?: string
      opacity?: number
      size?: string
      padding?: string
      textSize?: TextSize
      iconPosition?: string
    } | undefined
    const fontSizePx = effectiveStyles.fontSize(nodeStyle?.textSize)
    let valueHtml: string
    if (isContainer) {
      valueHtml = ''
    } else if (desc !== '') {
      valueHtml =
        `<div style="box-sizing:border-box;width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:${fontHex};font-family:${fontFamily};"><b style="font-size:${fontSizePx}px;">${
          escapeHtml(title)
        }</b><br/><span style="font-weight:normal;font-size:${fontSizePx}px;">${escapeHtml(desc)}</span></div>`
    } else {
      valueHtml =
        `<div style="box-sizing:border-box;width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:${fontHex};font-family:${fontFamily};"><b style="font-size:${fontSizePx}px;">${
          escapeHtml(title)
        }</b></div>`
    }
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
    const summaryRaw = (node as Node & { summary?: MarkdownOrString }).summary
    const summaryFlat = summaryRaw != null ? flattenMarkdownOrString(summaryRaw) : null
    const summaryStr = summaryFlat != null && !isEmptyish(summaryFlat) ? summaryFlat.trim() : ''
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
    if (strokeHex && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(strokeHex)) {
      likec4Extra.push(`likec4StrokeColor=${encodeURIComponent(strokeHex)}`)
    }
    const nodeNotation = (node as Node & { notation?: string }).notation
    if (nodeNotation != null && nodeNotation !== '') {
      likec4Extra.push(`likec4Notation=${encodeURIComponent(nodeNotation)}`)
    }
    const likec4Style = likec4Extra.length > 0 ? likec4Extra.join(';') + ';' : ''

    const nodeCustomData = (node as Node & { customData?: Record<string, string> }).customData
    const hasNodeCustomData = nodeCustomData &&
      typeof nodeCustomData === 'object' &&
      !Array.isArray(nodeCustomData) &&
      Object.keys(nodeCustomData).length > 0
    const userObjectXml = hasNodeCustomData
      ? '\n  <mxUserObject>' +
        Object.entries(nodeCustomData!)
          .map(([k, v]) => {
            const safeV = typeof v === 'string' ? v : (v != null ? String(v) : '')
            return `<data key="${escapeXml(k)}">${escapeXml(safeV)}</data>`
          })
          .join('') +
        '</mxUserObject>'
      : ''

    /** When the element has its own view (navigateTo), add Draw.io link so the cell opens that page. Use direct data:page/id,likec4-<viewId> in style so Draw.io recognizes it; UserObject link= for UI. */
    const navLinkStyle = navTo === '' ? '' : `link=${encodeURIComponent(`data:page/id,likec4-${navTo}`)};`
    const vertexTextStyle = isContainer
      ? 'align=left;verticalAlign=top;overflow=fill;whiteSpace=wrap;html=1;'
      : `align=center;verticalAlign=middle;verticalLabelPosition=middle;labelPosition=center;fontSize=${fontSizePx};fontStyle=1;spacingTop=4;spacingLeft=2;spacingRight=2;spacingBottom=2;overflow=fill;whiteSpace=wrap;html=1;fontFamily=${
        encodeURIComponent(fontFamily)
      };`

    /** Draw.io internal page link: UserObject must have label = cell value (HTML) so Edit Link shows "Internal page link". */
    const userObjectLabel = isContainer ? escapeXml(title) : value
    const geometryAttr = `height="${Math.round(height)}" width="${Math.round(width)}" x="${Math.round(x)}" y="${
      Math.round(y)
    }" as="geometry"`
    const innerCellXml =
      `<mxCell parent="${parentId}" style="${vertexTextStyle}${shapeStyle}${colorStyle}${strokeWidthStyle}${containerDashed}${opacityStyle}${navLinkStyle}${likec4Style}html=1;" value="${value}" vertex="1">
  <mxGeometry ${geometryAttr} />${userObjectXml}
</mxCell>`
    const cellXml = navTo === ''
      ? `<mxCell id="${id}" value="${value}" style="${vertexTextStyle}${shapeStyle}${colorStyle}${strokeWidthStyle}${containerDashed}${opacityStyle}${navLinkStyle}${likec4Style}html=1;" vertex="1" parent="${parentId}">\n  <mxGeometry x="${
        Math.round(x)
      }" y="${Math.round(y)}" width="${Math.round(width)}" height="${
        Math.round(height)
      }" as="geometry" />${userObjectXml}\n</mxCell>`
      : `<UserObject label="${userObjectLabel}" link="data:page/id,likec4-${
        escapeXml(navTo)
      }" id="${id}">\n  ${innerCellXml}\n</UserObject>`

    if (isContainer) {
      containerCells.push(cellXml)
      const titleId = String(containerTitleCellId++)
      const titleValue = escapeXml(title)
      const titleWidth = Math.max(60, Math.min(260, title.length * 8))
      const titleHeight = 18
      const titleParentId = id
      const titleX = 8
      const titleY = 8
      const titleStyle =
        `shape=text;html=1;fillColor=none;strokeColor=none;align=left;verticalAlign=top;fontSize=${containerTitleFontSizePx};fontStyle=1;fontColor=${containerTitleColor};fontFamily=${
          encodeURIComponent(fontFamily)
        };${navLinkStyle}`
      const titleInner =
        `<mxCell parent="${titleParentId}" style="${titleStyle}" value="${titleValue}" vertex="1">\n  <mxGeometry x="${
          Math.round(titleX)
        }" y="${Math.round(titleY)}" width="${titleWidth}" height="${titleHeight}" as="geometry" />\n</mxCell>`
      const titleCellXml = navTo === ''
        ? `<mxCell id="${titleId}" value="${titleValue}" style="${titleStyle}" vertex="1" parent="${titleParentId}">\n  <mxGeometry x="${
          Math.round(titleX)
        }" y="${Math.round(titleY)}" width="${titleWidth}" height="${titleHeight}" as="geometry" />\n</mxCell>`
        : `<UserObject label="${escapeXml(title)}" link="data:page/id,likec4-${
          escapeXml(navTo)
        }" id="${titleId}">\n  ${titleInner}\n</UserObject>`
      containerCells.push(titleCellXml)
    } else vertexCells.push(cellXml)
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
    const dashStyle = edge.line === 'dashed'
      ? 'dashed=1;'
      : edge.line === 'dotted'
      ? 'dashed=1;dashPattern=1 1;'
      : ''
    const endArrow = drawioArrow(edge.head)
    const startArrow = edge.tail == null || edge.tail === 'none' ? 'none' : drawioArrow(edge.tail)
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
    const hasEdgeCustomData = edgeCustomData &&
      typeof edgeCustomData === 'object' &&
      !Array.isArray(edgeCustomData) &&
      Object.keys(edgeCustomData).length > 0
    const edgeUserObjectXml = hasEdgeCustomData
      ? '\n  <mxUserObject>' +
        Object.entries(edgeCustomData!)
          .map(([k, v]) => {
            const safeV = typeof v === 'string' ? v : (v != null ? String(v) : '')
            return `<data key="${escapeXml(k)}">${escapeXml(safeV)}</data>`
          })
          .join('') +
        '</mxUserObject>'
      : ''

    /** Only round-trip waypoints; layout edge.points create too many vertices in draw.io. Use composite key so parallel edges get distinct waypoints. */
    const rawEdgePoints = edgeWaypoints?.[`${edge.source}|${edge.target}|${edge.id}`] ??
      edgeWaypoints?.[`${edge.source}|${edge.target}`]
    /** Flatten to [x,y][] so we never emit nested <Array><Array> (draw.io rejects it). */
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
  let viewDesc: string
  if (viewDescRaw != null && typeof viewDescRaw === 'object' && 'txt' in viewDescRaw) {
    viewDesc = String((viewDescRaw as { txt: string }).txt)
  } else if (viewDescRaw != null && typeof viewDescRaw === 'object' && 'md' in viewDescRaw) {
    viewDesc = String((viewDescRaw as { md: string }).md)
  } else if (typeof viewDescRaw === 'string') {
    viewDesc = viewDescRaw
  } else {
    viewDesc = ''
  }
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
  const rootCellStyle = rootParts.join('')

  const allCells = [
    `<mxCell id="${defaultParentId}" value="" style="${rootCellStyle}" vertex="1" parent="${rootId}">
  <mxGeometry x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" as="geometry" />
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
    d => `  <diagram name="${escapeXml(d.name)}" id="likec4-${escapeXml(d.id)}">${d.content}</diagram>`,
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
