import { type DiagramNode, type Fqn, invariant, nonNullable } from '@likec4/core'
import { type Expression, Operator, Strength } from '@lume/kiwi'
import * as kiwi from '@lume/kiwi'
import type { XYPosition } from '@xyflow/react'
import { isNil } from 'remeda'
import type { XYFlowNode } from '..'

// interface RectVariables {
//   // top left corner
//   readonly minX: kiwi.Variable
//   readonly minY: kiwi.Variable

//   // bottom right corner
//   readonly maxX: kiwi.Expression
//   readonly maxY: kiwi.Expression
// }

class RectConstraints {
  readonly width = new kiwi.Variable()
  readonly height = new kiwi.Variable()

  readonly minX = new kiwi.Variable()
  readonly minY = new kiwi.Variable()
  readonly maxX = new kiwi.Expression(this.minX, this.width)
  readonly maxY = new kiwi.Expression(this.minY, this.height)
  readonly children = [] as RectConstraints[]

  constructor(
    private solver: kiwi.Solver,
    public readonly xynode: XYFlowNode,
    public readonly parent: RectConstraints | null = null,
    public readonly isEditing: boolean = false
  ) {
    // const isEditing: boolean = xynode.dragging ?? false
    const pos = xynode.computed?.positionAbsolute ?? xynode.position
    const isCompound = xynode.type === 'compound'

    const width = xynode.computed?.width ?? xynode.width ?? xynode.data.element.width
    const height = xynode.computed?.height ?? xynode.height ?? xynode.data.element.height

    // this.width = isEditing || !isCompound ? new kiwi.Expression(width) : new kiwi.Variable()
    // this.height = isEditing || !isCompound ? new kiwi.Expression(height) : new kiwi.Variable()

    if (isEditing) {
      solver.addEditVariable(this.minX, Strength.strong)
      solver.addEditVariable(this.minY, Strength.strong)
      solver.suggestValue(this.minX, pos.x)
      solver.suggestValue(this.minY, pos.y)

      solver.createConstraint(this.width, Operator.Eq, width, Strength.required)
      solver.createConstraint(this.height, Operator.Eq, height, Strength.required)
    } else {
      if (isCompound) {
        solver.createConstraint(this.width, Operator.Ge, 1, Strength.required)
        solver.createConstraint(this.height, Operator.Ge, 1, Strength.required)
        solver.createConstraint(this.width, Operator.Le, width, Strength.weak)
        solver.createConstraint(this.height, Operator.Le, height, Strength.weak)
      } else {
        solver.createConstraint(this.minX, Operator.Eq, pos.x, Strength.weak)
        solver.createConstraint(this.minY, Operator.Eq, pos.y, Strength.weak)
        solver.createConstraint(this.width, Operator.Eq, width, Strength.strong)
        solver.createConstraint(this.height, Operator.Eq, height, Strength.strong)
      }
    }

    if (parent) {
      parent.addChild(this)
    }
  }

  protected addChild(rect: RectConstraints) {
    this.children.push(rect)

    let rectMinX = new kiwi.Expression(rect.minX, -30)
    let rectMinY = new kiwi.Expression(rect.minY, -40) // space for title bar
    let rectMaxX = new kiwi.Expression(rect.maxX, 30)
    let rectMaxY = new kiwi.Expression(rect.maxY, 30)

    this.solver.createConstraint(this.minX, Operator.Le, rectMinX, Strength.required)
    this.solver.createConstraint(this.minY, Operator.Le, rectMinY, Strength.required)
    this.solver.createConstraint(this.maxX, Operator.Ge, rectMaxX, Strength.required)
    this.solver.createConstraint(this.maxY, Operator.Ge, rectMaxY, Strength.required)
  }
}

export function createLayoutConstraints(xynodes: XYFlowNode[], draggingNodeId: string | null = null) {
  const solver = new kiwi.Solver()
  const rects = new Map<string, RectConstraints>()

  const rootNodes = xynodes.filter(n => isNil(n.parentNode))

  const traverse = rootNodes.map(xynode => ({
    xynode,
    parentRect: null as RectConstraints | null
  }))

  while (traverse.length > 0) {
    const { xynode, parentRect } = traverse.pop()!
    const isDragging = xynode.dragging === true || xynode.id === draggingNodeId
    const rect = new RectConstraints(solver, xynode, parentRect, isDragging)
    rects.set(xynode.id, rect)
    if (isDragging) {
      continue
    }
    if (xynode.data.element.children.length > 0) {
      const children = xynodes.flatMap(child =>
        child.parentNode === xynode.id
          ? ({
            xynode: child,
            parentRect: rect
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

  /**
   * Move the editing node to the given position.
   */
  function onNodeDrag(xynode: XYFlowNode) {
    const pos = nonNullable(xynode.computed?.positionAbsolute, 'No positionAbsolute')
    const rect = nonNullable(rects.get(xynode.id))
    solver.suggestValue(rect.minX, pos.x)
    solver.suggestValue(rect.minY, pos.y)
  }

  function updatePositions() {
    solver.updateVariables()
    return new Map([...rects.values()].map(rect => {
      const positionAbsolute = {
        x: rect.minX.value(),
        y: rect.minY.value()
      }
      const position = rect.parent
        ? {
          x: positionAbsolute.x - rect.parent.minX.value(),
          y: positionAbsolute.y - rect.parent.minY.value()
        }
        : positionAbsolute

      return [rect.xynode.id, {
        position,
        positionAbsolute,
        width: rect.width.value(),
        height: rect.height.value()
      }]
    }))
  }

  return {
    onNodeDrag,
    updatePositions
  }
}
