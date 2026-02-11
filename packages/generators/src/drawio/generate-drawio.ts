import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, DiagramNode, NodeId, ProcessedView } from '@likec4/core/types'
import { isNullish as isNil } from 'remeda'

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

/**
 * Map LikeC4 shape to DrawIO style. DrawIO uses shape=rectangle, ellipse, cylinder, etc.
 */
function drawioShape(shape: Node['shape']): string {
  switch (shape) {
    case 'person':
      return 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;'
    case 'rectangle':
      return 'shape=rectangle;'
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
      return 'shape=rectangle;'
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

/**
 * Generate DrawIO (mxGraph) XML from a layouted LikeC4 view.
 * Preserves positions, hierarchy, colors, descriptions and technology so the diagram
 * can be opened and edited in draw.io with full compatibility.
 *
 * @param viewmodel - Layouted LikeC4 view model (from model.view(id))
 * @returns DrawIO .drawio XML string
 */
export function generateDrawio(viewmodel: LikeC4ViewModel<aux.Unknown>): string {
  const view = viewmodel.$view
  const { nodes, edges } = view

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

  /** Support both BBox (x,y,width,height) and legacy position/size used in some mocks */
  const getBBox = (n: View['nodes'][number]) => {
    const d = n as DiagramNode & { position?: [number, number]; size?: { width: number; height: number } }
    const x = typeof d.x === 'number' ? d.x : (Array.isArray(d.position) ? d.position[0] : 0)
    const y = typeof d.y === 'number' ? d.y : (Array.isArray(d.position) ? d.position[1] : 0)
    const width = typeof d.width === 'number' ? d.width : (d.size?.width ?? 120)
    const height = typeof d.height === 'number' ? d.height : (d.size?.height ?? 60)
    return { x, y, width, height }
  }

  for (const node of sortedNodes) {
    const id = getCellId(node.id)
    const parentId = node.parent ? getCellId(node.parent) : defaultParentId
    const label = escapeXml(node.title)
    const shapeStyle = drawioShape(node.shape)
    const { x, y, width, height } = getBBox(node)

    const elemColors = getElementColors(viewmodel, node.color)
    const colorStyle = elemColors != null
      ? `fillColor=${elemColors.fill};strokeColor=${elemColors.stroke};fontColor=${elemColors.stroke};`
      : ''

    const desc = node.description != null && String(node.description).trim() !== ''
      ? escapeXml(String(node.description))
      : ''
    const tech = node.technology != null && String(node.technology).trim() !== ''
      ? escapeXml(String(node.technology))
      : ''
    const userData = desc !== '' || tech !== ''
      ? `\n  <mxUserObject><data key="likec4Description">${desc}</data><data key="likec4Technology">${tech}</data></mxUserObject>`
      : ''

    vertexCells.push(
      `<mxCell id="${id}" value="${label}" style="${shapeStyle}${colorStyle}verticalAlign=middle;align=center;overflow=fill;spacingLeft=2;spacingRight=2;spacingTop=2;spacingBottom=2;" vertex="1" parent="${parentId}">${userData}
  <mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${
        Math.round(height)
      }" as="geometry" />
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
    edgeCells.push(
      `<mxCell id="${id}" value="${label}" style="endArrow=block;html=1;rounded=0;exitX=1;exitY=0.5;entryX=0;entryY=0.5;strokeColor=${strokeColor};${dashStyle}" edge="1" parent="${defaultParentId}" source="${sourceId}" target="${targetId}">
  <mxGeometry relative="1" as="geometry" />
</mxCell>`,
    )
  }

  let bounds: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  }
  try {
    const b = viewmodel.bounds
    if (b != null && typeof b.x === 'number') bounds = b
  } catch {
    // View not layouted (e.g. in tests); use default canvas size
  }
  const allCells = [
    `<mxCell id="${defaultParentId}" vertex="1" parent="${rootId}">
  <mxGeometry x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" as="geometry" />
</mxCell>`,
    ...vertexCells,
    ...edgeCells,
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="LikeC4" modified="${new Date().toISOString()}" agent="LikeC4" version="1.0" etag="" type="device">
  <diagram name="${escapeXml(view.id)}" id="likec4-${escapeXml(view.id)}">
    <mxGraphModel dx="800" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale=1 pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="${rootId}" />
        ${allCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
}
