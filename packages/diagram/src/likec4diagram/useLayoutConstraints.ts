import { type BBox, type NodeId, type NonEmptyArray, type Point, DefaultMap, exact, nonNullable } from '@likec4/core'
import type {
  EdgeReplaceChange,
  InternalNode as RFInternalNode,
  NodeChange,
  OnNodeDrag,
  XYPosition,
} from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { useMemo, useRef } from 'react'
import { filter, first, flatMap, forEach, hasAtLeast, map, pipe, take } from 'remeda'
import { type DiagramApi, type XYStoreApi, useXYStoreApi } from '../hooks'
// import { type XYStoreApi } from '../hooks/useXYFlow'
import { change } from 'khroma'
import { s } from 'motion/react-m'
import { useDiagram } from '../hooks/useDiagram'
import { isSamePoint } from '../utils'
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
      width: this.maxX - this.minX,
      height: this.maxY - this.minY,
    }
  }

  get diff(): XYPosition | null {
    if (!isSamePoint(this.positionAbsolute, this.initialPositionAbsolute)) {
      return {
        x: this.positionAbsolute.x - this.initialX,
        y: this.positionAbsolute.y - this.initialY,
      }
    }
    return null
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

/**
 * Creates a modifier function that moves edge points according to the given rectangle's diff.
 */
function makeEdgeRelativeModifier(
  edge: Types.AnyEdge,
  anchor: Rect,
) {
  return (): EdgeReplaceChange<Types.AnyEdge> | null => {
    const diff = anchor.diff
    if (!diff) {
      return null
    }
    return {
      id: edge.id,
      type: 'replace',
      item: {
        ...edge,
        data: {
          ...edge.data,
          points: map(edge.data.points, pt => [pt[0] + diff.x, pt[1] + diff.y] as Point),
          ...(edge.data.controlPoints && {
            controlPoints: (edge.data.controlPoints ?? []).map(pt => ({
              x: pt.x + diff.x,
              y: pt.y + diff.y,
            })),
          }),
          ...(edge.data.labelXY && {
            labelXY: {
              x: edge.data.labelXY.x + diff.x,
              y: edge.data.labelXY.y + diff.y,
            },
          }),
          labelBBox: (edge.data.labelBBox
            ? {
              x: edge.data.labelBBox.x + diff.x,
              y: edge.data.labelBBox.y + diff.y,
              width: edge.data.labelBBox.width,
              height: edge.data.labelBBox.height,
            }
            : null) as BBox,
        },
      },
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
    const shouldTraverse = !isEditing
      && ancestorsOfDraggingNodes.has(xynode.id)

    if (shouldTraverse) {
      const rect = new CompoundRect(xynode, parent)
      rects.set(xynode.id, rect)
      parentLookup.get(xynode.id)?.forEach(child => {
        traverse.push({
          xynode: child,
          parent: rect as CompoundRect,
        })
      })
    } else {
      rects.set(xynode.id, new Leaf(xynode, parent))
    }
  }
  const rectsToUpdate = [...rects.values()]

  /**
   * Edges that need to be updated because both source and target are moved
   * - source and target are inside a compound node that is moved
   * - source and target are selected and moved
   */
  const edgeModifiers = new Map<Types.AnyEdge, () => EdgeReplaceChange<Types.AnyEdge> | null>()

  // First, find edges inside moving compound nodes (selected compound nodes)
  for (const r of rectsToUpdate) {
    // Moving compound node will be Leaf
    if (r instanceof CompoundRect) {
      continue
    }
    // Find nested nodes
    const nested = nestedOf.get(r.id)
    if (nested.size === 0) {
      continue
    }
    // Find edges that have both ends inside nested nodes
    pipe(
      edges,
      filter(e => nested.has(e.source) && nested.has(e.target)),
      map((edge) => [edge, makeEdgeRelativeModifier(edge, r)] as const),
      forEach(([edge, modifier]) => edgeModifiers.set(edge, modifier)),
    )
  }

  // moving nodes may have nested nodes as well
  const movingNodes = new Set(editingNodeIds.flatMap(id => [id, ...nestedOf.get(id)]))

  // When multiple nodes are moved, we need to update all edges that have both ends in moving nodes
  if (editingNodeIds.length > 1) {
    for (const edge of edges) {
      if (edgeModifiers.has(edge) || !(movingNodes.has(edge.source) && movingNodes.has(edge.target))) {
        continue
      }
      let r = rects.get(edge.source)
        ?? rects.get(edge.target)
        ?? ancestorsOf.get(edge.source).map(id => rects.get(id)).find(s => !!s)
        ?? ancestorsOf.get(edge.target).map(id => rects.get(id)).find(s => !!s)
      if (r) {
        edgeModifiers.set(edge, makeEdgeRelativeModifier(edge, r))
      }
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

  function updateXYFlowNodes() {
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
    xyflowApi.getState().triggerNodeChanges(nodeUpdates)
  }

  let animationFrameId: number | null = null
  let edgeAnimationFrameId: number | null = null

  function onMove() {
    if (rectsToUpdate.length === 0) {
      return
    }
    animationFrameId ??= requestAnimationFrame(() => {
      animationFrameId = null
      for (const id of editingNodeIds) {
        const rect = nonNullable(rects.get(id))
        const node = nonNullable(nodeLookup.get(id))
        rect.positionAbsolute = node.internals.positionAbsolute
      }
      updateXYFlowNodes()
    })
    if (_edgeModifiers.length === 0) {
      return
    }
    if (edgeAnimationFrameId) {
      cancelAnimationFrame(edgeAnimationFrameId)
    }
    edgeAnimationFrameId = requestAnimationFrame(() => {
      edgeAnimationFrameId = null
      const changes = _edgeModifiers.flatMap(fm => fm() ?? [])
      if (changes.length > 0) {
        xyflowApi.getState().triggerEdgeChanges(changes)
      }
    })
  }

  return {
    rects: rects as ReadonlyMap<string, Leaf | CompoundRect>,
    updateXYFlowNodes,
    onMove,
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
    let wasPending = false
    const initial = { x: 0, y: 0 }
    let moved = false
    return ({
      onNodeDragStart: (_event, xynode) => {
        wasPending = diagram.cancelSaveManualLayout()
        const { nodeLookup } = xystore.getState()
        const draggingNodes = pipe(
          Array.from(nodeLookup.values()),
          filter(n => n.draggable !== false && (n.dragging === true || n.id === xynode.id || n.selected === true)),
        )
        if (hasAtLeast(draggingNodes, 1)) {
          solverRef.current = createLayoutConstraints(xystore, map(draggingNodes, x => x.id))
        }
        initial.x = _event.clientX
        initial.y = _event.clientY
        moved = false
      },
      onNodeDrag: (_event) => {
        moved = Math.abs(_event.clientX - initial.x) > 4 || Math.abs(_event.clientY - initial.y) > 4
        solverRef.current?.onMove()
      },
      onNodeDragStop: (_event) => {
        moved = Math.abs(_event.clientX - initial.x) > 4 || Math.abs(_event.clientY - initial.y) > 4
        if (wasPending || moved) {
          diagram.scheduleSaveManualLayout()
        }
        solverRef.current = undefined
      },
    })
  }, [xystore, diagram])
}
