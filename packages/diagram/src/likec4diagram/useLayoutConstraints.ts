import { type NonEmptyArray, DefaultMap, nonNullable } from '@likec4/core'
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
import { filter, forEach, hasAtLeast, map, pipe } from 'remeda'
import { Vector } from 'vecti'
import { type XYStoreApi, useXYStoreApi } from '../hooks'
import { useDiagram } from '../hooks/useDiagram'
import { bezierControlPoints, isSamePoint } from '../utils'
import { getNodeCenter } from './custom/edges/utils'
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

type EdgeModifier = (edgeLookup: EdgeLookup<Types.AnyEdge>) => EdgeReplaceChange<Types.AnyEdge> | null

/**
 * Creates a modifier function that moves edge points according to the given rectangle's diff.
 */
function makeEdgeModifier(
  edge: Types.AnyEdge,
  anchor: Rect,
): EdgeModifier {
  return (edgeLookup: EdgeLookup<Types.AnyEdge>): EdgeReplaceChange<Types.AnyEdge> | null => {
    const current = edgeLookup.get(edge.id)
    const diff = anchor.diff
    if (!diff || !current) {
      return null
    }
    return {
      id: edge.id,
      type: 'replace',
      item: produce(current, draft => {
        draft.data.points = map(edge.data.points, pt => [pt[0] + diff.x, pt[1] + diff.y] satisfies [number, number])
        if (edge.data.controlPoints) {
          draft.data.controlPoints = (edge.data.controlPoints ?? []).map(pt => ({
            x: pt.x + diff.x,
            y: pt.y + diff.y,
          }))
        }
        if (edge.data.labelXY) {
          draft.data.labelXY = {
            x: edge.data.labelXY.x + diff.x,
            y: edge.data.labelXY.y + diff.y,
          }
        }
        if (edge.data.labelBBox) {
          draft.data.labelBBox = {
            x: edge.data.labelBBox.x + diff.x,
            y: edge.data.labelBBox.y + diff.y,
            width: edge.data.labelBBox.width,
            height: edge.data.labelBBox.height,
          }
        }
      }),
    }
  }
}

export function createLayoutConstraints(
  xyflowApi: XYStoreApi,
  editingNodeIds: NonEmptyArray<string>,
) {
  const { parentLookup, nodeLookup, edges, edgeLookup } = xyflowApi.getState()
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
  const edgeModifiers = new Map<Types.AnyEdge, EdgeModifier>()

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
      map((edge) => [edge, makeEdgeModifier(edge, r)] as const),
      forEach(([edge, modifier]) => edgeModifiers.set(edge, modifier)),
    )
  }

  // moving nodes may have nested nodes as well
  const movingNodes = new Set(editingNodeIds.flatMap(id => [id, ...nestedOf.get(id)]))

  // When multiple nodes are moved, we update edges between them
  if (editingNodeIds.length > 1) {
    for (const edge of edges) {
      if (edgeModifiers.has(edge) || !(movingNodes.has(edge.source) && movingNodes.has(edge.target))) {
        continue
      }
      // Find the anchor rectangle for the edge
      let r = rects.get(edge.source)
        ?? rects.get(edge.target)
        ?? ancestorsOf.get(edge.source).map(id => rects.get(id)).find(s => !!s)
        ?? ancestorsOf.get(edge.target).map(id => rects.get(id)).find(s => !!s)
      if (r) {
        edgeModifiers.set(edge, makeEdgeModifier(edge, r))
      }
    }
  }

  const findMovingAncestor = (nodeId: string): Rect | null => {
    return rects.get(nodeId) ?? ancestorsOf.get(nodeId).map(id => rects.get(id)).find(s => !!s) ?? null
  }

  // When source or target is moved, move control points and label position accordingly
  for (const edge of edges) {
    if (edgeModifiers.has(edge)) {
      continue
    }
    const isSourceMoving = movingNodes.has(edge.source)
    const isTargetMoving = movingNodes.has(edge.target)
    if (isSourceMoving !== isTargetMoving) {
      const movingRect = isSourceMoving ? findMovingAncestor(edge.source) : findMovingAncestor(edge.target)
      if (!movingRect) {
        continue
      }
      const controlPoints = edge.data.controlPoints ?? bezierControlPoints(edge.data.points)

      const sourceCenter = getNodeCenter(nodeLookup.get(edge.source)!)
      const sourceCenterV = new Vector(
        sourceCenter.x,
        sourceCenter.y,
      )
      const targetCenter = getNodeCenter(nodeLookup.get(edge.target)!)
      const targetCenterV = new Vector(
        targetCenter.x,
        targetCenter.y,
      )

      // Determine anchor (moving point) and static point
      const [anchorCenter, staticCenter] = isSourceMoving
        ? [sourceCenterV, targetCenterV]
        : [targetCenterV, sourceCenterV]

      const toStatic = anchorCenter.subtract(staticCenter).normalize()

      edgeModifiers.set(edge, (edgeLookup) => {
        const current = edgeLookup.get(edge.id)
        const diff = movingRect.diff
        if (!diff || !current) {
          return null
        }
        const d = new Vector(diff.x, diff.y)

        const newAnchorCenter = new Vector(
          anchorCenter.x + diff.x,
          anchorCenter.y + diff.y,
        )
        const toStaticNew = newAnchorCenter.subtract(staticCenter).normalize()

        const relativePoint = (pt: { x: number; y: number }) => {
          const p = new Vector(pt.x, pt.y)
          const projLength = p.subtract(anchorCenter).dot(toStatic)
          const projPoint = newAnchorCenter.add(toStaticNew.multiply(projLength))
          const perp = p.subtract(projPoint)
          const newPoint = projPoint.add(perp)
          const movedPoint = newPoint.add(d)
          return {
            x: movedPoint.x,
            y: movedPoint.y,
          }
        }

        return {
          id: edge.id,
          type: 'replace',
          item: produce(current, draft => {
            draft.data.controlPoints = controlPoints.map(pt => {
              return relativePoint(pt)
            })

            if (edge.data.labelBBox) {
              const movedPoint = relativePoint(edge.data.labelBBox)
              draft.data.labelBBox = {
                x: movedPoint.x,
                y: movedPoint.y,
                width: edge.data.labelBBox.width,
                height: edge.data.labelBBox.height,
              }
            }
            if (edge.data.labelXY) {
              draft.data.labelXY = relativePoint(edge.data.labelXY)
            }
          }),
        }
      })
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
    xyflowApi.getState().triggerNodeChanges(nodeUpdates)

    const changes = _edgeModifiers.flatMap(fm => fm(edgeLookup) ?? [])
    if (changes.length > 0) {
      xyflowApi.getState().triggerEdgeChanges(changes)
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
        const rect = nonNullable(rects.get(id))
        const node = nonNullable(nodeLookup.get(id))
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
        moved = moved || Math.abs(_event.clientX - initial.x) > 4 || Math.abs(_event.clientY - initial.y) > 4
        if (moved) {
          solverRef.current?.onMove()
        }
      },
      onNodeDragStop: (_event) => {
        if (wasPending || moved) {
          diagram.scheduleSaveManualLayout()
        }
        solverRef.current = undefined
      },
    })
  }, [xystore, diagram])
}
