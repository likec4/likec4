import { type DiagramNode, type Fqn, invariant, nonNullable } from '@likec4/core'
import { type Expression, Operator, Strength } from '@lume/kiwi'
import * as kiwi from '@lume/kiwi'
import type { XYPosition } from '@xyflow/react'

// interface RectVariables {
//   // top left corner
//   readonly minX: kiwi.Variable
//   readonly minY: kiwi.Variable

//   // bottom right corner
//   readonly maxX: kiwi.Expression
//   readonly maxY: kiwi.Expression
// }

class RectConstraints {
  // x = new kiwi.Variable()
  // y = new kiwi.Variable()

  readonly width = new kiwi.Variable()
  readonly height = new kiwi.Variable()

  // readonly minX = new kiwi.Expression(this.x)
  // readonly minY = new kiwi.Expression(this.y)
  readonly minX = new kiwi.Variable()
  readonly minY = new kiwi.Variable()
  readonly maxX = new kiwi.Expression(this.minX, this.width)
  readonly maxY = new kiwi.Expression(this.minY, this.height)

  readonly children = new Set<RectConstraints>()
  // centerX = new kiwi.Expression(this.x, [this.width, 0.5])

  constructor(
    private solver: kiwi.Solver,
    public readonly diagramNode: DiagramNode,
    public readonly parent: RectConstraints | null = null,
    public isEditing: boolean = false
  ) {
    if (diagramNode.children.length === 0) {
      solver.createConstraint(this.width, Operator.Eq, diagramNode.width, Strength.required)
      solver.createConstraint(this.height, Operator.Eq, diagramNode.height, Strength.required)
    } else {
      solver.createConstraint(this.width, Operator.Ge, 10, Strength.required)
      solver.createConstraint(this.height, Operator.Ge, 10, Strength.required)
      solver.createConstraint(this.width, Operator.Le, diagramNode.width, Strength.weak)
      solver.createConstraint(this.height, Operator.Le, diagramNode.height, Strength.weak)
    }

    if (parent) {
      parent.addChild(this)
    }

    if (isEditing) {
      solver.addEditVariable(this.minX, Strength.strong)
      solver.addEditVariable(this.minY, Strength.strong)
      solver.suggestValue(this.minX, diagramNode.position[0])
      solver.suggestValue(this.minY, diagramNode.position[1])
    } else {
      this.initialPosition()
    }
  }

  protected addChild(rect: RectConstraints) {
    this.children.add(rect)
    let rectMinX = new kiwi.Expression(rect.minX, -30)
    let rectMinY = new kiwi.Expression(rect.minY, -40) // space for title bar
    let rectMaxX = new kiwi.Expression(rect.maxX, 30)
    let rectMaxY = new kiwi.Expression(rect.maxY, 30)
    this.solver.createConstraint(this.minX, Operator.Le, rectMinX, Strength.strong)
    this.solver.createConstraint(this.minY, Operator.Le, rectMinY, Strength.strong)
    this.solver.createConstraint(this.maxX, Operator.Ge, rectMaxX, Strength.strong)
    this.solver.createConstraint(this.maxY, Operator.Ge, rectMaxY, Strength.strong)
    this.solver.createConstraint(this.maxY, Operator.Ge, rectMaxY, Strength.strong)
  }

  // private constraintSize() {
  //   this.solver.createConstraint(this.width, Operator.Eq, this.c4node.width, Strength.required)
  //   this.solver.createConstraint(this.height, Operator.Eq, this.c4node.height, Strength.required)
  // }

  protected initialPosition() {
    const [x, y] = this.diagramNode.position
    this.solver.createConstraint(this.minX, Operator.Eq, x, Strength.weak)
    this.solver.createConstraint(this.minY, Operator.Eq, y, Strength.weak)
  }

  // pin(node: DiagramNode) {
  //   this.solver.addEditVariable(this.x, Strength.medium)
  //   this.solver.suggestValue(this.x, node.position[0])
  //   this.solver.addEditVariable(this.y, Strength.medium)
  //   this.solver.suggestValue(this.y, node.position[1])
  //   this.solver.addEditVariable(this.width, Strength.strong)
  //   this.solver.suggestValue(this.width, node.width)
  //   this.solver.addEditVariable(this.height, Strength.strong)
  //   this.solver.suggestValue(this.height, node.height)
  // }
}

export function createLayoutConstraints(nodes: DiagramNode[], editingNodeId = null as Fqn | null) {
  const solver = new kiwi.Solver()
  const rects = new Map<Fqn, RectConstraints>()

  let editingRect: RectConstraints | undefined

  for (let diagramNode of nodes) {
    const parent = diagramNode.parent ? nonNullable(rects.get(diagramNode.parent)) : null
    const isEditing = diagramNode.id === editingNodeId
    const rect = new RectConstraints(solver, diagramNode, parent, isEditing)
    rects.set(diagramNode.id, rect)
    if (isEditing) {
      editingRect = rect
    }
  }

  solver.updateVariables()

  //   for (let node of nodes) {
  //     let constraintNode = constraintNodes.get(node.id)!
  //     console.log(`
  // node: ${node.id} ${node.children.length > 0 ? '[compound]' : ''}
  //   origin:
  //     x:${node.position[0]}, y:${node.position[1]}
  //     w:${node.width}, h:${node.height}
  //   solved
  //     x: ${constraintNode.x.value()}, y: ${constraintNode.y.value()}
  //     w: ${constraintNode.width.value()}, h: ${constraintNode.height.value()}`.trimStart())
  //   }

  /**
   * Move the editing node to the given position.
   */
  function moveTo({ x, y }: XYPosition) {
    invariant(editingRect, 'No editing node')
    solver.suggestValue(editingRect.minX, x)
    solver.suggestValue(editingRect.minY, y)
  }

  function solve() {
    solver.updateVariables()
    return [...rects.values()].map(rect => {
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

      return {
        id: rect.diagramNode.id,
        position,
        positionAbsolute,
        width: rect.width.value(),
        height: rect.height.value(),
        isEditing: rect.isEditing
      }
    })
  }

  return {
    moveTo,
    solve
  }
}
