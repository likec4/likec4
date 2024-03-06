import { invariant, isAncestor, nonNullable } from '@likec4/core'
import * as kiwi from '@lume/kiwi'
import { Expression, Expression as Expr, Operator, Strength, type Variable } from '@lume/kiwi'
import type { ReactFlowProps, XYPosition } from '@xyflow/react'
import { deepEqual as eq } from 'fast-equals'
import { type Ref, type RefObject, useMemo, useRef } from 'react'
import { isNil } from 'remeda'
import { type XYFlowInstance, XYFlowNode } from './types'

abstract class Rect {
  id!: string
  minX = new kiwi.Variable()
  minY = new kiwi.Variable()
  maxX: Expression | Variable = new kiwi.Variable()
  maxY: Expression | Variable = new kiwi.Variable()

  get x() {
    return this.minX
  }

  get y() {
    return this.minY
  }

  get positionAbsolute(): XYPosition {
    return {
      x: this.x.value(),
      y: this.y.value()
    }
  }

  // Position relative to parent
  get position(): XYPosition {
    const positionAbsolute = this.positionAbsolute
    return this.parent
      ? {
        x: positionAbsolute.x - this.parent.x.value(),
        y: positionAbsolute.y - this.parent.y.value()
      }
      : positionAbsolute
  }
  protected abstract parent: Compound | null
}

class Compound extends Rect {
  protected readonly children = [] as Rect[]

  constructor(
    protected solver: kiwi.Solver,
    xynode: XYFlowNode,
    protected readonly parent: Compound | null = null
  ) {
    super()
    this.id = xynode.id

    solver.createConstraint(this.maxX, Operator.Ge, this.minX)
    solver.createConstraint(this.maxY, Operator.Ge, this.minY)

    if (parent) {
      parent.addChild(this)
    }
  }

  addChild<R extends Rect>(rect: R) {
    this.children.push(rect)

    const leftPadding = new Expr(
      rect.minX,
      [-1, this.minX]
    )
    const { weak } = Strength
    this.solver.createConstraint(leftPadding, Operator.Ge, 32)
    this.solver.createConstraint(leftPadding, Operator.Eq, 32, weak)

    const topPadding = new Expr(
      rect.minY,
      [-1, this.minY]
    )
    this.solver.createConstraint(topPadding, Operator.Ge, 52)
    this.solver.createConstraint(topPadding, Operator.Eq, 52, weak)

    const rightPadding = new Expr(
      this.maxX,
      [-1, rect.maxX]
    )
    this.solver.createConstraint(rightPadding, Operator.Ge, 32)
    this.solver.createConstraint(rightPadding, Operator.Eq, 32, weak)

    const bottomPadding = new Expr(
      this.maxY,
      [-1, rect.maxY]
    )
    this.solver.createConstraint(bottomPadding, Operator.Ge, 32)
    this.solver.createConstraint(bottomPadding, Operator.Eq, 32, weak)
  }
}

class Leaf extends Rect {
  override readonly id: string

  constructor(
    solver: kiwi.Solver,
    xynode: XYFlowNode,
    public readonly parent: Compound | null = null,
    public readonly isEditing: boolean = false
  ) {
    super()
    this.id = xynode.id

    // const isEditing: boolean = xynode.dragging ?? false
    const pos = xynode.computed?.positionAbsolute ?? {
      x: xynode.data.element.position[0],
      y: xynode.data.element.position[1]
    }

    const width = xynode.computed?.width ?? xynode.data.element.width
    const height = xynode.computed?.height ?? xynode.data.element.height

    this.maxX = new kiwi.Expression(this.minX, width)
    this.maxY = new kiwi.Expression(this.minY, height)

    // solver.createConstraint(this.width, Operator.Eq, width, Strength.required)
    // solver.createConstraint(this.height, Operator.Eq, height, Strength.required)

    if (isEditing) {
      const superStrong = Strength.create(100, 0, 0)
      solver.addEditVariable(this.minX, superStrong)
      solver.addEditVariable(this.minY, superStrong)
      solver.suggestValue(this.minX, pos.x)
      solver.suggestValue(this.minY, pos.y)
    } else {
      const halfMedium = Strength.create(0.0, 1.0, 0.0, 0.5)
      solver.createConstraint(this.minX, Operator.Eq, pos.x, halfMedium)
      solver.createConstraint(this.minY, Operator.Eq, pos.y, halfMedium)
      // const weaker = Strength.create(0.0, 0.0, 1.0, 0.5)
      // const weak = Strength.create(0.0, 0.0, 1.0)
      // const x = new Expr(
      //   this.minX,
      //   [-1, pos.x]
      // )
      // solver.createConstraint(x, Operator.Eq, 0, weaker)
      // solver.createConstraint(x, Operator.Ge, -30, weak)
      // solver.createConstraint(x, Operator.Le, 30, weak)

      // const y = new Expr(
      //   this.minY,
      //   [-1, pos.y]
      // )
      // solver.createConstraint(y, Operator.Eq, 0, weaker)
      // solver.createConstraint(y, Operator.Ge, -30, weak)
      // solver.createConstraint(y, Operator.Le, 30, weak)
    }

    if (parent) {
      parent.addChild(this)
    }
  }
}

function createLayoutConstraints(xyflow: XYFlowInstance, draggingNodeId: string) {
  const solver = new kiwi.Solver()
  const rects = new Map<string, Leaf | Compound>()

  const xynodes = xyflow.getNodes()
  const rootNodes = xynodes.filter(n => isNil(n.parentNode))

  const traverse = rootNodes.map(xynode => ({
    xynode,
    parent: null as Compound | null
  }))

  const rootRects = [] as Array<Leaf | Compound>

  while (traverse.length > 0) {
    const { xynode, parent } = traverse.pop()!
    const isDragging = xynode.dragging === true || xynode.id === draggingNodeId
    const isCompound = !isDragging && xynode.type === 'compound' && isAncestor(xynode.id, draggingNodeId)
    const rect = isCompound ? new Compound(solver, xynode, parent) : new Leaf(solver, xynode, parent, isDragging)
    rects.set(xynode.id, rect)
    if (!parent) {
      rootRects.push(rect)
    }
    if (isCompound) {
      const children = xynodes.flatMap(child =>
        child.parentNode === xynode.id
          ? ({
            xynode: child,
            parent: rect as Compound
          })
          : []
      )
      traverse.push(
        ...children
      )
    }
  }

  solver.updateVariables()
  solver.maxIterations = 1000

  function updateXYFlowNodes() {
    solver.updateVariables()
    xyflow.setNodes(nodes =>
      nodes.map((n) => {
        if (n.id === draggingNodeId || n.dragging === true) {
          return n
        }
        const rect = rects.get(n.id)
        if (!rect) {
          return n
        }
        const updates = {
          position: rect.position,
          width: rect.maxX.value() - rect.minX.value(),
          height: rect.maxY.value() - rect.minY.value()
        }
        if (eq(n.position, updates.position) && eq(n.width, updates.width) && eq(n.height, updates.height)) {
          return n
        }
        return {
          ...n,
          ...updates
        }
      })
    )
  }

  let animationFrameId: number | null = null

  /**
   * Move the editing node to the given position.
   */
  function onNodeDrag(xynode: XYFlowNode) {
    const pos = nonNullable(xynode.computed?.positionAbsolute, 'No positionAbsolute')
    const rect = nonNullable(rects.get(xynode.id))
    solver.suggestValue(rect.minX, pos.x)
    solver.suggestValue(rect.minY, pos.y)

    animationFrameId ??= window.requestAnimationFrame(() => {
      updateXYFlowNodes()
      animationFrameId = null
    })
  }

  return {
    onNodeDrag,
    updateXYFlowNodes
  }
}

export function useNodeDragConstraints(
  xyflow: RefObject<XYFlowInstance | undefined>
): Required<Pick<ReactFlowProps<XYFlowNode>, 'onNodeDragStart' | 'onNodeDrag' | 'onNodeDragStop'>> {
  const solverRef = useRef<ReturnType<typeof createLayoutConstraints>>()
  return useMemo(() => ({
    onNodeDragStart: (event, xynode) => {
      invariant(xyflow.current, 'xyflow.current should be defined')
      invariant(!solverRef.current, 'solverRef.current should be undefined')
      solverRef.current = createLayoutConstraints(xyflow.current, xynode.id)
    },
    onNodeDrag: (event, xynode) => {
      invariant(solverRef.current, 'solverRef.current should be defined')
      solverRef.current?.onNodeDrag(xynode)
    },
    onNodeDragStop: (event, xynode) => {
      // solverRef.current?.onNodeDrag(xynode)
      solverRef.current = undefined
    }
  }), [xyflow])
}
