import {
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type NodeId,
  type WhereOperator,
  BBox,
  GroupElementKind,
  invariant,
  nonNullable,
  Queue,
  RichText,
  whereOperatorAsPredicate,
} from '@likec4/core'
import { hasAtLeast, pick } from 'remeda'
import { ZIndexes } from '../../base/const'
import type { Types } from '../types'

export function diagramToXY(opts: {
  view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | 'bounds' | '_type'>
  where: WhereOperator | null
}): {
  bounds: BBox
  xynodes: Types.Node[]
  xyedges: Types.Edge[]
} {
  const {
    view,
  } = opts
  const xynodes = [] as Types.Node[],
    xyedges = [] as Types.Edge[],
    nodeLookup = new Map<Fqn, DiagramNode>()

  type TraverseItem = {
    node: DiagramNode
    parent: DiagramNode | null
  }
  const queue = Queue.from(view.nodes.reduce(
    (acc, node) => {
      nodeLookup.set(node.id, node)
      if (!node.parent) {
        acc.push({ node, parent: null })
      }
      return acc
    },
    [] as TraverseItem[],
  ))

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
  // const visiblePredicate = opts.where ? whereOperatorAsPredicate(opts.where) : () => true

  // namespace to force unique ids
  const ns = ''
  const nodeById = (id: Fqn) => nonNullable(nodeLookup.get(id), `Node not found: ${id}`)

  let next: TraverseItem | undefined
  while ((next = queue.dequeue())) {
    const { node, parent } = next
    const isCompound = hasAtLeast(node.children, 1) || node.kind == GroupElementKind
    if (isCompound) {
      for (const child of node.children) {
        queue.enqueue({ node: nodeById(child), parent: node })
      }
    }

    const position = {
      x: node.x,
      y: node.y,
    }
    if (parent) {
      position.x -= parent.x
      position.y -= parent.y
    }

    const id = ns + node.id as NodeId

    const drifts = node.drifts ?? null

    const base = {
      id,
      deletable: false,
      position,
      zIndex: isCompound ? ZIndexes.Compound : ZIndexes.Element,
      style: {
        width: node.width,
        height: node.height,
      },
      measured: {
        width: node.width,
        height: node.height,
      },
      initialWidth: node.width,
      initialHeight: node.height,
      hidden: node.kind !== GroupElementKind && !visiblePredicate(node),
      ...(parent && {
        parentId: ns + parent.id,
      }),
    } satisfies Omit<Types.Node, 'data' | 'type'>

    const compoundData = {
      viewId: view.id,
      id: node.id,
      title: node.title,
      color: node.color,
      shape: node.shape,
      style: node.style,
      depth: node.depth ?? 0,
      icon: node.icon ?? 'none',
      tags: node.tags ?? null,
      x: node.x,
      y: node.y,
    } satisfies Types.CompoundNodeData

    const leafNodeData = {
      viewId: view.id,
      id: node.id,
      title: node.title,
      technology: node.technology ?? null,
      description: node.description ?? null,
      height: node.height,
      width: node.width,
      level: node.level,
      color: node.color,
      shape: node.shape,
      style: node.style,
      icon: node.icon ?? null,
      tags: node.tags,
      x: node.x,
      y: node.y,
      isMultiple: node.style?.multiple ?? false,
    } satisfies Types.LeafNodeData

    if (node.kind === GroupElementKind) {
      xynodes.push({
        ...base,
        type: 'view-group',
        data: {
          isViewGroup: true,
          ...compoundData,
        },
        dragHandle: '.likec4-compound-title-container',
      })
      continue
    }

    const modelFqn = node.modelRef ?? null
    const deploymentFqn = node.deploymentRef ?? null
    if (!modelFqn && !deploymentFqn) {
      console.error('Invalid node', node)
      throw new Error('Element should have either modelRef or deploymentRef')
    }

    const navigateTo = { navigateTo: node.navigateTo ?? null }

    switch (true) {
      case isCompound && !!deploymentFqn: {
        xynodes.push(
          {
            ...base,
            type: 'compound-deployment',
            data: {
              ...compoundData,
              ...navigateTo,
              deploymentFqn,
              modelFqn,
              drifts,
            },
          } satisfies Types.CompoundDeploymentNode,
        )
        break
      }
      case isCompound: {
        invariant(!!modelFqn, 'ModelRef expected')
        xynodes.push(
          {
            ...base,
            type: 'compound-element',
            data: {
              ...compoundData,
              ...navigateTo,
              modelFqn,
              drifts,
            },
          } satisfies Types.CompoundElementNode,
        )
        break
      }
      case !!deploymentFqn: {
        xynodes.push(
          {
            ...base,
            type: 'deployment',
            data: {
              ...leafNodeData,
              ...navigateTo,
              deploymentFqn,
              modelFqn,
              drifts,
            },
          } satisfies Types.DeploymentElementNode,
        )
        break
      }
      default: {
        invariant(!!modelFqn, 'ModelRef expected')
        xynodes.push(
          {
            ...base,
            type: 'element',
            data: {
              ...leafNodeData,
              ...navigateTo,
              modelFqn,
              drifts,
            },
          } satisfies Types.ElementNode,
        )
      }
    }
  }
  for (const edge of view.edges) {
    const source = edge.source
    const target = edge.target
    const id = ns + edge.id as EdgeId

    if (!hasAtLeast(edge.points, 2)) {
      console.error('edge should have at least 2 points', edge)
      continue
    }

    xyedges.push({
      id,
      type: 'relationship',
      source: ns + source,
      target: ns + target,
      zIndex: ZIndexes.Edge,
      hidden: !visiblePredicate(edge),
      deletable: false,
      data: {
        id: edge.id,
        label: edge.label,
        technology: edge.technology,
        notes: edge.notes ?? null,
        navigateTo: edge.navigateTo,
        controlPoints: edge.controlPoints ?? null,
        labelBBox: edge.labelBBox ?? null,
        labelXY: edge.labelBBox ? { x: edge.labelBBox.x, y: edge.labelBBox.y } : null,
        points: edge.points,
        color: edge.color ?? 'gray',
        line: edge.line ?? 'dashed',
        dir: edge.dir ?? 'forward',
        head: edge.head ?? 'normal',
        tail: edge.tail ?? 'none',
        astPath: edge.astPath,
        drifts: edge.drifts ?? null,
      },
      interactionWidth: 20,
    })
  }

  return {
    bounds: view.bounds,
    xynodes,
    xyedges,
  }
}
