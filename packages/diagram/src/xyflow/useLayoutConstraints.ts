import { type NodeId, type NonEmptyArray, nonNullable } from '@likec4/core'
import type { NodeChange, ReactFlowProps, XYPosition } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { useMemo, useRef } from 'react'
import { filter, hasAtLeast, isNullish, map, pipe } from 'remeda'
import { useDiagramStoreApi } from '../hooks'
import { type XYStoreApi } from '../hooks/useXYFlow'
import type { DiagramFlowTypes } from './types'

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
    this.maxX += pos.x - this.minX
    this.maxY += pos.y - this.minY

    this.minX = pos.x
    this.minY = pos.y
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
  protected abstract parent: Compound | null
}

class Compound extends Rect {
  public readonly children = [] as Rect[]

  constructor(
    xynode: DiagramFlowTypes.InternalNode,
    protected readonly parent: Compound | null = null,
  ) {
    super()
    this.id = xynode.id

    if (parent) {
      parent.children.push(this)
    }
  }
}

class Leaf extends Rect {
  constructor(
    xynode: DiagramFlowTypes.InternalNode,
    public readonly parent: Compound | null = null,
  ) {
    super()
    this.id = xynode.id

    this.positionAbsolute = xynode.internals.positionAbsolute

    const { width, height } = getNodeDimensions(xynode)

    this.maxX = this.minX + Math.ceil(width)
    this.maxY = this.minY + Math.ceil(height)

    if (parent) {
      parent.children.push(this)
    }
  }
}

type NodePositionUpdater = (
  nodes: Array<{ rect: Rect | Compound; node: DiagramFlowTypes.InternalNode }>,
) => void

export function createLayoutConstraints(
  xyflowApi: XYStoreApi,
  editingNodeIds: NonEmptyArray<string>,
) {
  const { parentLookup, nodeLookup } = xyflowApi.getState()
  const rects = new Map<string, Leaf | Compound>()

  const ancestorsOf = (nodeId: string) => {
    const ancestors = [] as string[]
    const xynode = nodeLookup.get(nodeId)
    let parent = xynode?.parentId
    let parentNode: DiagramFlowTypes.InternalNode | undefined
    while (parent && (parentNode = nodeLookup.get(parent))) {
      ancestors.push(parentNode.id as NodeId)
      parent = parentNode.parentId
    }
    return ancestors
  }

  const ancestorsOfDraggingNodes = new Set(
    editingNodeIds.flatMap(ancestorsOf),
  )

  const traverse = new Array<{ xynode: DiagramFlowTypes.InternalNode; parent: Compound | null }>()

  for (const [, xynode] of nodeLookup) {
    if (isNullish(xynode.parentId)) {
      traverse.push({
        xynode,
        parent: null,
      })
    }
  }

  while (traverse.length > 0) {
    const { xynode, parent } = traverse.shift()!
    const isEditing = editingNodeIds.includes(xynode.id)

    // Traverse children if the node is a compound, not dragging, and is an ancestor of the dragging node
    const shouldTraverse = !isEditing && xynode.type === 'compound'
      && ancestorsOfDraggingNodes.has(xynode.id)

    const rect = shouldTraverse ? new Compound(xynode, parent) : new Leaf(xynode, parent)
    rects.set(xynode.id, rect)

    if (shouldTraverse) {
      parentLookup.get(xynode.id)?.forEach(child => {
        traverse.push({
          xynode: child,
          parent: rect as Compound,
        })
      })
    }
  }

  const rectsToUpdate = [...rects.values()]
  applyConstraints(rectsToUpdate)

  function applyConstraints(targets: Rect[]) {
    targets
      .filter(x => x instanceof Compound)
      .forEach((r) => {
        applyConstraints(r.children)

        const childrenBB = r.children.reduce((acc, r) => ({
          minX: Math.min(acc.minX, r.minX),
          minY: Math.min(acc.minY, r.minY),
          maxX: Math.max(acc.maxX, r.maxX),
          maxY: Math.max(acc.maxY, r.maxY),
        }), {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity,
        })

        r.minX = childrenBB.minX - Rect.LeftPadding
        r.minY = childrenBB.minY - Rect.TopPadding
        r.maxX = childrenBB.maxX + Rect.RightPadding
        r.maxY = childrenBB.maxY + Rect.BottomPadding
      })
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
        if (r instanceof Compound) {
          acc.push({
            id: r.id,
            type: 'dimensions',
            setAttributes: true,
            dimensions: r.dimensions,
          })
        }
        return acc
      }, [] as NodeChange<DiagramFlowTypes.Node>[]),
    )
  }

  let animationFrameId: number | null = null

  function onMove(
    updater: NodePositionUpdater,
  ) {
    if (rectsToUpdate.length === 0) {
      return
    }
    animationFrameId ??= requestAnimationFrame(() => {
      animationFrameId = null
      updater(
        pipe(
          editingNodeIds,
          filter(id => rects.has(id) && nodeLookup.has(id)),
          map(id => ({
            rect: nonNullable(rects.get(id)),
            node: nonNullable(nodeLookup.get(id)),
          })),
        ),
      )
      updateXYFlowNodes()
    })
  }

  return {
    updateXYFlowNodes,
    onMove,
  }
}

type LayoutConstraints = Required<
  Pick<ReactFlowProps<DiagramFlowTypes.Node>, 'onNodeDragStart' | 'onNodeDrag' | 'onNodeDragStop'>
>
/**
 * Keeps the layout constraints (parent nodes and children) when dragging a node
 */
export function useLayoutConstraints(): LayoutConstraints {
  const diagramApi = useDiagramStoreApi()
  const solverRef = useRef<ReturnType<typeof createLayoutConstraints>>(undefined)
  return useMemo((): LayoutConstraints => ({
    onNodeDragStart: (_event, xynode) => {
      const { cancelSaveManualLayout, xystore } = diagramApi.getState()
      const { nodeLookup } = xystore.getState()
      cancelSaveManualLayout()

      const draggingNodes = pipe(
        Array.from(nodeLookup.values()),
        filter(n => n.dragging === true || n.id === xynode.id || n.selected === true),
        filter(n => n.draggable !== false),
        map(x => x.id),
      )
      if (hasAtLeast(draggingNodes, 1)) {
        solverRef.current = createLayoutConstraints(xystore, draggingNodes)
      }
    },
    onNodeDrag: () => {
      solverRef.current?.onMove((nodes) => {
        nodes.forEach(({ rect, node }) => {
          rect.positionAbsolute = node.internals.positionAbsolute
        })
      })
    },
    onNodeDragStop: () => {
      solverRef.current?.updateXYFlowNodes()
      diagramApi.getState().scheduleSaveManualLayout()
      solverRef.current = undefined
    },
  }), [diagramApi])
}
