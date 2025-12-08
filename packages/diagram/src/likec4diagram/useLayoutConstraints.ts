import { type NonEmptyArray, BBox, DefaultMap, nonNullable } from '@likec4/core'
import { invariant, isome } from '@likec4/core/utils'
import type {
  EdgeReplaceChange,
  InternalNode as RFInternalNode,
  NodeChange,
  OnNodeDrag,
  XYPosition,
} from '@xyflow/react'
import { type EdgeLookup, getNodeDimensions } from '@xyflow/system'
import { produce } from 'immer'
import { useMemo, useRef } from 'react'
import { clamp, difference, filter, flatMap, hasAtLeast, map, pipe, unique } from 'remeda'
import { type XYStoreApi, useXYStoreApi } from '../hooks'
import { useDiagram } from '../hooks/useDiagram'
import { bezierControlPoints, vector } from '../utils'
import { nodeToRect } from '../utils/xyflow'
import type { Types } from './types'

type InternalNode = RFInternalNode<Types.AnyNode>

abstract class Rect {
  static readonly LeftPadding = 42
  static readonly RightPadding = 42
  static readonly TopPadding = 60
  static readonly BottomPadding = 42

  id!: string
  minX: number = Infinity
  minY: number = Infinity
  maxX: number = -Infinity
  maxY: number = -Infinity

  readonly initialX: number
  readonly initialY: number

  get positionAbsolute(): XYPosition {
    return {
      x: this.minX,
      y: this.minY,
    }
  }

  get initialPositionAbsolute(): XYPosition {
    return {
      x: this.initialX,
      y: this.initialY,
    }
  }

  set positionAbsolute(pos: XYPosition) {
    const x = Math.round(pos.x)
    const y = Math.round(pos.y)
    this.maxX += x - this.minX
    this.maxY += y - this.minY

    this.minX = x
    this.minY = y
  }

  get dimensions() {
    return {
      width: Math.round(this.maxX - this.minX),
      height: Math.round(this.maxY - this.minY),
    }
  }

  get diff(): XYPosition {
    return {
      x: Math.round(this.positionAbsolute.x - this.initialX),
      y: Math.round(this.positionAbsolute.y - this.initialY),
    }
  }

  get isMoved(): boolean {
    return this.diff.x !== 0 || this.diff.y !== 0
  }

  // Position relative to parent
  get position(): XYPosition {
    const positionAbsolute = this.positionAbsolute
    if (!this.parent) {
      return positionAbsolute
    }
    const parentPosition = this.parent.positionAbsolute
    return {
      x: positionAbsolute.x - parentPosition.x,
      y: positionAbsolute.y - parentPosition.y,
    }
  }
  protected abstract parent: CompoundRect | null

  constructor(
    xynode: InternalNode,
    parent: CompoundRect | null = null,
  ) {
    this.id = xynode.id
    this.positionAbsolute = !parent ? xynode.position : {
      x: xynode.position.x + parent.minX,
      y: xynode.position.y + parent.minY,
    }

    const { width, height } = getNodeDimensions(xynode)

    this.maxX = this.minX + Math.ceil(width)
    this.maxY = this.minY + Math.ceil(height)

    this.initialX = this.positionAbsolute.x
    this.initialY = this.positionAbsolute.y

    if (parent) {
      parent.children.push(this)
    }
  }
}

class CompoundRect extends Rect {
  public readonly children = [] as Rect[]

  constructor(
    xynode: InternalNode,
    public readonly parent: CompoundRect | null = null,
  ) {
    super(xynode, parent)
  }
}

class Leaf extends Rect {
  constructor(
    xynode: InternalNode,
    public readonly parent: CompoundRect | null = null,
  ) {
    super(xynode, parent)
  }
}

type EdgeModifier = (edgeLookup: EdgeLookup<Types.AnyEdge>) => EdgeReplaceChange<Types.AnyEdge>

/**
 * Creates a modifier function that moves edge points according to the given rectangle's diff.
 */
function makeEdgeModifier(
  edge: Types.AnyEdge,
  anchor: Rect,
): EdgeModifier {
  const controlPoints = edge.data.controlPoints ?? null
  return (edgeLookup) => {
    const current = nonNullable(edgeLookup.get(edge.id), `Edge ${edge.id} not found`)
    const { x: dx, y: dy } = anchor.diff
    if (dx === 0 && dy === 0) {
      return {
        id: edge.id,
        type: 'replace',
        item: produce(current, draft => {
          draft.data.points = edge.data.points as NonEmptyArray<[number, number]>
          draft.data.controlPoints = controlPoints
          draft.data.labelBBox = edge.data.labelBBox
        }),
      }
    }
    return {
      id: edge.id,
      type: 'replace',
      item: produce(current, draft => {
        draft.data.points = map(edge.data.points, pt => [pt[0] + dx, pt[1] + dy] satisfies [number, number])
        if (controlPoints) {
          draft.data.controlPoints = controlPoints.map(pt => ({
            x: pt.x + dx,
            y: pt.y + dy,
          }))
        }
        if (edge.data.labelBBox) {
          draft.data.labelBBox = {
            x: edge.data.labelBBox.x + dx,
            y: edge.data.labelBBox.y + dy,
            width: edge.data.labelBBox.width,
            height: edge.data.labelBBox.height,
          }
        }
      }),
    }
  }
}

/**
 * Creates a modifier function that moves edge points when one of its nodes is moved.
 */
function makeRelativeEdgeModifier(
  edge: Types.AnyEdge,
  movingRect: Rect,
  anchorNode: BBox,
  staticNode: BBox,
): EdgeModifier {
  const controlPoints = edge.data.controlPoints ?? bezierControlPoints(edge.data.points)
  const anchorV = vector(BBox.center(anchorNode))
  const staticV = vector(BBox.center(staticNode))

  const staticToAnchor = anchorV.subtract(staticV)
  const staticToAnchorLength = staticToAnchor.length()

  return (edgeLookup) => {
    const current = nonNullable(edgeLookup.get(edge.id), `Edge ${edge.id} not found`)
    const { x: dx, y: dy } = movingRect.diff
    if (dx === 0 && dy === 0) {
      return {
        id: edge.id,
        type: 'replace',
        item: produce(current, draft => {
          draft.data.points = edge.data.points as NonEmptyArray<[number, number]>
          draft.data.controlPoints = edge.data.controlPoints
          draft.data.labelBBox = edge.data.labelBBox
        }),
      }
    }
    const d = vector(dx, dy)

    const relativePoint = (pt: { x: number; y: number }) => {
      const p = vector(pt)
      const staticToP = p.subtract(staticV)
      const projLength = staticToP.dot(staticToAnchor)
      // relative coefficient of the point between static and anchor
      // clamp to (-1,1) to avoid invalid positions when control point goes beyond anchor
      const coeff = clamp(projLength / (staticToAnchorLength ** 2), {
        min: -1,
        max: 1,
      })

      return p
        .add(d.multiply(coeff))
        .round()
        .toObject()
    }

    return {
      id: edge.id,
      type: 'replace',
      item: produce(current, draft => {
        draft.data.controlPoints = controlPoints.map(relativePoint)

        if (edge.data.labelBBox) {
          draft.data.labelBBox ??= edge.data.labelBBox
          const { x, y } = relativePoint(edge.data.labelBBox)
          draft.data.labelBBox.x = x
          draft.data.labelBBox.y = y
        }
      }),
    }
  }
}

export function createLayoutConstraints(
  xyflowApi: XYStoreApi,
  editingNodeIds: NonEmptyArray<string>,
) {
  const { parentLookup, nodeLookup, edges } = xyflowApi.getState()
  const rects = new Map<string, Leaf | CompoundRect>()

  /** Maps node id to all its ancestors */
  const ancestorsOf = new DefaultMap<string, string[]>((nodeId): string[] => {
    const xynode = nodeLookup.get(nodeId)
    let parent = xynode?.parentId
    if (!parent) {
      return []
    }
    return [parent, ...ancestorsOf.get(parent)]
  })

  /** Maps node id to all its nested descendants */
  const nestedOf = new DefaultMap<string, Set<string>>((nodeId) => {
    const children = parentLookup.get(nodeId)
    if (!children || children.size === 0) {
      return new Set()
    }
    const nested = new Set<string>()
    for (const child of children.values()) {
      nested.add(child.id)
      for (const desc of nestedOf.get(child.id)) {
        nested.add(desc)
      }
    }
    return nested
  })

  // If multiple nodes are being edited, ensure they are not nested within each other
  if (hasAtLeast(editingNodeIds, 2)) {
    const leafsOnly = pipe(
      editingNodeIds,
      flatMap(id => [...nestedOf.get(id)]),
      unique(),
      exclude => difference(editingNodeIds, exclude),
    )
    invariant(hasAtLeast(leafsOnly, 1), 'All editing nodes are nested within each other')
    editingNodeIds = leafsOnly
  }

  const ancestorsOfDraggingNodes = new Set(
    editingNodeIds.flatMap(i => ancestorsOf.get(i)),
  )

  // Build Rects tree, starting from root nodes
  const traverse: Array<{ xynode: InternalNode; parent: CompoundRect | null }> = [...nodeLookup.values()].flatMap(x =>
    !x.parentId ? { xynode: x, parent: null } : []
  )

  while (traverse.length > 0) {
    const { xynode, parent } = traverse.shift()!
    const isEditing = editingNodeIds.includes(xynode.id)

    // Traverse children if the node is a compound, not dragging, and is an ancestor of the dragging node
    const shouldTraverse = !isEditing && ancestorsOfDraggingNodes.has(xynode.id)

    if (shouldTraverse) {
      const rect = new CompoundRect(xynode, parent)
      rects.set(xynode.id, rect)
      parentLookup.get(xynode.id)?.forEach(child => {
        traverse.push({
          xynode: child,
          parent: rect as CompoundRect,
        })
      })
      continue
    }
    rects.set(xynode.id, new Leaf(xynode, parent))
  }
  const rectsToUpdate = [...rects.values()]

  /**
   * Edges that need to be updated because both source and target are moved
   * - source and target are inside a compound node that is moved
   * - source and target are selected and moved
   */
  const edgeModifiers = new Map<Types.AnyEdge, EdgeModifier>()

  const findMovingAncestor = (nodeId: string): Rect | null => {
    return rects.get(nodeId) ?? ancestorsOf.get(nodeId).map(id => rects.get(id)).find(s => !!s) ?? null
  }

  // moving nodes may have nested nodes as well
  const movingNodes = new Set(editingNodeIds.flatMap(id => [id, ...nestedOf.get(id)]))
  for (const edge of edges) {
    const isSourceMoving = movingNodes.has(edge.source)
    const isTargetMoving = movingNodes.has(edge.target)

    // We update edges, where both source and target are moving nodes
    if (isSourceMoving && isTargetMoving) {
      // Find the anchor rectangle for the edge
      let r = rects.get(edge.source)
        ?? rects.get(edge.target)
        ?? findMovingAncestor(edge.source)
        ?? findMovingAncestor(edge.target)
      if (r) {
        edgeModifiers.set(edge, makeEdgeModifier(edge, r))
      }
      continue
    }

    // When source OR target is moved, move control points and label position relatively
    if (isSourceMoving !== isTargetMoving) {
      const movingRect = isSourceMoving ? findMovingAncestor(edge.source) : findMovingAncestor(edge.target)
      if (!movingRect) {
        continue
      }

      const [sourceNode, targetNode] = pipe(
        [edge.source, edge.target] as const,
        map(id => nonNullable(nodeLookup.get(id), `Node ${id} not found`)),
        map(nodeToRect),
      )

      // Determine anchor (moving point) and static point
      const [anchorNode, staticNode] = isSourceMoving
        ? [sourceNode, targetNode]
        : [targetNode, sourceNode]

      edgeModifiers.set(
        edge,
        makeRelativeEdgeModifier(
          edge,
          movingRect,
          anchorNode,
          staticNode,
        ),
      )
      continue
    }
  }

  function applyConstraints(targets: Rect[]) {
    for (const r of targets) {
      if (!(r instanceof CompoundRect)) {
        continue
      }

      applyConstraints(r.children)

      const childrenBB = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }

      for (const child of r.children) {
        childrenBB.minX = Math.min(childrenBB.minX, child.minX)
        childrenBB.minY = Math.min(childrenBB.minY, child.minY)
        childrenBB.maxX = Math.max(childrenBB.maxX, child.maxX)
        childrenBB.maxY = Math.max(childrenBB.maxY, child.maxY)
      }

      r.minX = childrenBB.minX - Rect.LeftPadding
      r.minY = childrenBB.minY - Rect.TopPadding
      r.maxX = childrenBB.maxX + Rect.RightPadding
      r.maxY = childrenBB.maxY + Rect.BottomPadding
    }
  }

  const _edgeModifiers = [...edgeModifiers.values()]

  function updateXYFlow() {
    applyConstraints(rectsToUpdate)

    const nodeUpdates = rectsToUpdate.reduce((acc, r) => {
      acc.push({
        id: r.id,
        type: 'position',
        dragging: false,
        position: r.position,
        positionAbsolute: r.positionAbsolute,
      })
      if (r instanceof CompoundRect) {
        acc.push({
          id: r.id,
          type: 'dimensions',
          setAttributes: true,
          dimensions: r.dimensions,
        })
      }
      return acc
    }, [] as NodeChange<Types.Node>[])
    const { edgeLookup, triggerNodeChanges, triggerEdgeChanges } = xyflowApi.getState()
    triggerNodeChanges(nodeUpdates)

    const changes = _edgeModifiers.map(fm => fm(edgeLookup))
    if (changes.length > 0) {
      triggerEdgeChanges(changes)
    }
  }

  let animationFrameId: number | null = null

  function onMove() {
    if (rectsToUpdate.length === 0) {
      return
    }
    // Force update on next animation frame
    animationFrameId ??= requestAnimationFrame(() => {
      animationFrameId = null
      for (const id of editingNodeIds) {
        const rect = rects.get(id)
        if (!rect) {
          console.warn(`Rect not found for id ${id}`)
          continue
        }
        const node = nodeLookup.get(id)
        if (!node) {
          console.warn(`Node not found for id ${id}`)
          continue
        }
        rect.positionAbsolute = node.internals.positionAbsolute
      }
      updateXYFlow()
    })
  }

  return {
    rects: rects as ReadonlyMap<string, Leaf | CompoundRect>,
    onMove,
    updateXYFlow,
  }
}

type LayoutConstraints = {
  onNodeDragStart: OnNodeDrag<Types.Node>
  onNodeDrag: OnNodeDrag<Types.Node>
  onNodeDragStop: OnNodeDrag<Types.Node>
}
/**
 * Keeps the layout constraints (parent nodes and children) when dragging a node
 */
export function useLayoutConstraints(): LayoutConstraints {
  const xystore = useXYStoreApi()
  const diagram = useDiagram()
  const solverRef = useRef<ReturnType<typeof createLayoutConstraints>>(undefined)
  return useMemo((): LayoutConstraints => {
    return ({
      onNodeDragStart: (_event, xynode) => {
        diagram.startEditing('node')
        const { nodeLookup } = xystore.getState()
        const draggingNodes = pipe(
          Array.from(nodeLookup.values()),
          filter(n => (n.dragging === true || n.id === xynode.id || n.selected === true)),
          map(n => n.id),
        )
        if (hasAtLeast(draggingNodes, 1)) {
          solverRef.current = createLayoutConstraints(xystore, draggingNodes)
        }
      },
      onNodeDrag: (_event) => {
        solverRef.current?.onMove()
      },
      onNodeDragStop: (_event) => {
        const moved = solverRef.current ? isome(solverRef.current.rects.values(), r => r.isMoved) : false
        diagram.stopEditing(moved)
        solverRef.current = undefined
      },
    })
  }, [xystore, diagram])
}
