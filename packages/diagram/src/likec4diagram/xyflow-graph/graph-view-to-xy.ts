import {
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type NodeId,
  type WhereOperator,
  nonNullable,
  whereOperatorAsPredicate,
} from '@likec4/core'
import type { Point } from '@likec4/core/geometry'
import { pick } from 'remeda'
import { ZIndexes } from '../../base/const'
import { readableText } from '../../utils'
import type { Types } from '../types'

/**
 * Diameter (in px) of the circle used to represent an element in "graph" display variant.
 */
export const GraphNodeDiameter = 20

function sentence(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => !!part).map(part => part.endsWith('.') ? part : `${part}.`).join(' ')
}

function nodeAriaLabel(node: DiagramNode): string {
  const title = readableText(node.title) ?? node.id
  const description = readableText(node.description)
  return sentence([
    title,
    node.technology && `Technology: ${node.technology}`,
    description && `Description: ${description}`,
  ])
}

function edgeAriaLabel(edge: DiagramEdge, source: DiagramNode, target: DiagramNode): string {
  const sourceTitle = readableText(source.title) ?? source.id
  const targetTitle = readableText(target.title) ?? target.id
  return sentence([
    `Relationship from ${sourceTitle} to ${targetTitle}`,
    edge.technology && `Technology: ${edge.technology}`,
  ])
}

/**
 * Converts an element view to a compact "graph" rendering:
 * - compound nodes are flattened away, only leaf elements are rendered
 * - each leaf element becomes a fixed-size circle, centered at its layouted position
 *   (so switching between "diagram" and "graph" variants preserves the mental map)
 * - edges are straight lines between circle centers, with labels hidden
 */
export function graphViewToXY(opts: {
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges'>
  where: WhereOperator | null
}): {
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const { view } = opts
  const xynodes: Types.Node[] = []
  const xyedges: Types.Edge[] = []
  const nodeLookup = new Map<Fqn, DiagramNode>()
  for (const node of view.nodes) {
    nodeLookup.set(node.id, node)
  }
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let visiblePredicate = (_nodeOrEdge: DiagramNode | DiagramEdge): boolean => true
  if (opts.where) {
    try {
      const filterablePredicate = whereOperatorAsPredicate(opts.where)
      visiblePredicate = i =>
        filterablePredicate({
          ...pick(i, ['tags', 'kind']),
          ...('source' in i ? { source: nodeById(i.source) } : i),
          ...('target' in i ? { target: nodeById(i.target) } : i),
        })
    } catch (e) {
      console.error('Error in where filter:', e)
    }
  }

  const radius = GraphNodeDiameter / 2
  // Only leaf elements are rendered - compound (and view-group) nodes are flattened away
  const isLeaf = (node: DiagramNode) => node.children.length === 0

  for (const node of view.nodes) {
    if (!isLeaf(node)) {
      continue
    }

    const modelFqn = node.modelRef ?? null
    const deploymentFqn = node.deploymentRef ?? null
    if (!modelFqn && !deploymentFqn) {
      continue
    }

    const id = node.id as NodeId
    const centerX = node.x + node.width / 2
    const centerY = node.y + node.height / 2

    xynodes.push(
      {
        id,
        type: 'graph-element',
        deletable: false,
        selectable: true,
        position: {
          x: centerX - radius,
          y: centerY - radius,
        },
        zIndex: ZIndexes.Element,
        style: {
          width: GraphNodeDiameter,
          height: GraphNodeDiameter,
        },
        ariaLabel: nodeAriaLabel(node),
        initialWidth: GraphNodeDiameter,
        initialHeight: GraphNodeDiameter,
        hidden: !visiblePredicate(node),
        data: {
          viewId: view.id,
          id: node.id,
          title: node.title,
          technology: node.technology ?? null,
          description: node.description ?? null,
          notes: node.notes,
          color: node.color,
          shape: node.shape,
          style: node.style,
          level: node.level,
          // Original layouted geometry, kept for generic node utilities (bounds, navigation, etc.)
          // - the rendered circle size is controlled separately via style/initialWidth/initialHeight above
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          icon: node.icon ?? null,
          tags: node.tags,
          isMultiple: node.style?.multiple ?? false,
          drifts: node.drifts ?? null,
          modelFqn,
          deploymentFqn,
          navigateTo: node.navigateTo ?? null,
        },
      } satisfies Types.GraphElementNode,
    )
  }

  for (const edge of view.edges) {
    const source = nodeLookup.get(edge.source)
    const target = nodeLookup.get(edge.target)
    // Skip edges that touch a compound node, since compounds are flattened away in graph mode
    if (!source || !target || !isLeaf(source) || !isLeaf(target)) {
      continue
    }

    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 }
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 }
    // 4 points (start, 2 control points, end) so bezierPath renders a single, visually straight segment
    const p0: Point = [sourceCenter.x, sourceCenter.y]
    const p3: Point = [targetCenter.x, targetCenter.y]
    const p1: Point = [p0[0] + (p3[0] - p0[0]) / 3, p0[1] + (p3[1] - p0[1]) / 3]
    const p2: Point = [p0[0] + (p3[0] - p0[0]) * 2 / 3, p0[1] + (p3[1] - p0[1]) * 2 / 3]

    const id = edge.id as EdgeId
    xyedges.push(
      {
        id,
        type: 'relationship',
        source: edge.source,
        target: edge.target,
        ariaLabel: edgeAriaLabel(edge, source, target),
        zIndex: ZIndexes.Edge,
        hidden: !visiblePredicate(edge),
        deletable: false,
        selectable: true,
        data: {
          id: edge.id,
          label: null,
          technology: edge.technology,
          notes: edge.notes ?? null,
          navigateTo: edge.navigateTo,
          // Empty (not null/undefined) control points switch the edge to computing its path live
          // from the connected nodes' current positions/borders, instead of the static `points`
          // below - required in graph mode, where node centers keep moving (drag, simulation).
          controlPoints: [],
          labelBBox: null,
          isLabelCustomized: false,
          labelXY: null,
          points: [p0, p1, p2, p3],
          color: edge.color ?? 'gray',
          line: edge.line ?? 'dashed',
          dir: edge.dir ?? 'forward',
          head: edge.head ?? 'normal',
          tail: edge.tail ?? 'none',
          astPath: edge.astPath,
          drifts: edge.drifts ?? null,
        },
        interactionWidth: 20,
      } satisfies Types.RelationshipEdge,
    )
  }

  return {
    xynodes,
    xyedges,
  }
}
