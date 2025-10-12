import { type NodeId, type NonEmptyArray, nonNullable } from '@likec4/core'
import type { InternalNode as RFInternalNode, NodeChange, OnNodeDrag, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { useMemo, useRef } from 'react'
import { filter, hasAtLeast, map, pipe } from 'remeda'
import { type XYStoreApi, useXYStoreApi } from '../hooks'
// import { type XYStoreApi } from '../hooks/useXYFlow'
import { useDiagram } from '../hooks/useDiagram'
import type { Types } from './types'

type InternalNode = RFInternalNode<Types.AnyNode>

abstract class Rect {
  static readonly LeftPadding = 40
  static readonly RightPadding = 40
  static readonly TopPadding = 55
  static readonly BottomPadding = 40

  id!: string
  minX: number = Infinity
  minY: number = Infinity
  maxX: number = -Infinity
  maxY: number = -Infinity

  get positionAbsolute(): XYPosition {
    return {
      x: this.minX,
      y: this.minY,
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

export function createLayoutConstraints(
  xyflowApi: XYStoreApi,
  editingNodeIds: NonEmptyArray<string>,
) {
  const { parentLookup, nodeLookup } = xyflowApi.getState()
  const rects = new Map<string, Leaf | CompoundRect>()

  const ancestorsOf = (nodeId: string) => {
    const ancestors = [] as string[]
    const xynode = nodeLookup.get(nodeId)
    let parent = xynode?.parentId
    let parentNode: InternalNode | undefined
    while (parent && (parentNode = nodeLookup.get(parent))) {
      ancestors.push(parentNode.id as NodeId)
      parent = parentNode.parentId
    }
    return ancestors
  }

  const ancestorsOfDraggingNodes = new Set(
    editingNodeIds.flatMap(ancestorsOf),
  )

  const traverse: Array<{ xynode: InternalNode; parent: CompoundRect | null }> = [...nodeLookup.values()].flatMap(x =>
    !x.parentId ? { xynode: x, parent: null } : []
  )

  while (traverse.length > 0) {
    const { xynode, parent } = traverse.shift()!
    const isEditing = editingNodeIds.includes(xynode.id)

    // Traverse children if the node is a compound, not dragging, and is an ancestor of the dragging node
    const shouldTraverse = !isEditing
      && xynode.type !== 'element'
      && xynode.type !== 'deployment'
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
  applyConstraints(rectsToUpdate)

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

  function updateXYFlowNodes() {
    applyConstraints(rectsToUpdate)
    xyflowApi.getState().triggerNodeChanges(
      rectsToUpdate.reduce((acc, r) => {
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
      }, [] as NodeChange<Types.Node>[]),
    )
  }

  let animationFrameId: number | null = null

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
