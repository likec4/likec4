import { type DiagramNode, type Fqn, invariant, isAncestor, nonNullable } from '@likec4/core'
import { Expression, Operator, Strength, type Variable } from '@lume/kiwi'
import { Expression as Expr } from '@lume/kiwi'
import * as kiwi from '@lume/kiwi'
import type { XYPosition } from '@xyflow/react'
import { hasAtLeast, isNil } from 'remeda'
import type { XYFlowNode } from '..'

abstract class Rect {
  readonly id!: string
  // readonly width: Expression | Variable = new kiwi.Variable()
  // readonly height: Expression | Variable = new kiwi.Variable()
  readonly minX = new kiwi.Variable()
  readonly minY = new kiwi.Variable()
  maxX: Expression | Variable = new kiwi.Variable()
  maxY: Expression | Variable = new kiwi.Variable()
  width!: Expression
  height!: Expression

  // readonly bbox = {
  //   minX: new Expr(this.minX, -30),
  //   minY: new Expr(this.minY, -30),
  //   maxX: new Expr(this.minX, this.width, 30),
  //   maxY: new Expr(this.minY, this.height, 30)
  // } as const

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

  override readonly id: string

  constructor(
    protected solver: kiwi.Solver,
    xynode: XYFlowNode,
    protected readonly parent: Compound | null = null
  ) {
    super()
    this.id = xynode.id

    this.width = this.maxX.minus(this.minX)
    this.height = this.maxY.minus(this.minY)

    solver.createConstraint(this.width, Operator.Ge, 10)
    solver.createConstraint(this.height, Operator.Ge, 10)
    // solver.createConstraint(this.maxY, Operator.Ge, this.minY)

    // const width = xynode.computed?.width ?? xynode.data.element.width
    // const height = xynode.computed?.height ?? xynode.data.element.height

    // solver.createConstraint(this.width, Operator.Le, 300, Strength.weak)
    // solver.createConstraint(this.height, Operator.Le, 200, Strength.weak)

    // solver.createConstraint(this.width, Operator.Ge, 10, Strength.weak)
    // solver.createConstraint(this.height, Operator.Ge, 10, Strength.weak)

    if (parent) {
      parent.addChild(this)
    }
  }

  addChild<R extends Rect>(rect: R) {
    this.children.push(rect)
    const bbox = {
      minX: new Expr(rect.minX, -30),
      minY: new Expr(rect.minY, -30),
      maxX: new Expr(rect.maxX, 30),
      maxY: new Expr(rect.maxY, 30)
    } as const

    this.solver.createConstraint(this.minX, Operator.Le, bbox.minX)
    this.solver.createConstraint(this.minY, Operator.Le, bbox.minY)
    this.solver.createConstraint(this.maxX, Operator.Ge, bbox.maxX)
    this.solver.createConstraint(this.maxY, Operator.Ge, bbox.maxY)
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

    this.width = new kiwi.Expression(width)
    this.height = new kiwi.Expression(height)

    this.maxX = new kiwi.Expression(this.minX, width)
    this.maxY = new kiwi.Expression(this.minY, height)

    // solver.createConstraint(this.width, Operator.Eq, width, Strength.required)
    // solver.createConstraint(this.height, Operator.Eq, height, Strength.required)

    if (isEditing) {
      solver.addEditVariable(this.minX, Strength.strong)
      solver.addEditVariable(this.minY, Strength.strong)
      solver.suggestValue(this.minX, pos.x)
      solver.suggestValue(this.minY, pos.y)
    } else {
      solver.createConstraint(this.minX, Operator.Eq, pos.x, Strength.strong)
      solver.createConstraint(this.minY, Operator.Eq, pos.y, Strength.strong)

      // solver.createConstraint(this.minX, Operator.Ge, pos.x - 50, Strength.weak)
      // solver.createConstraint(this.minX, Operator.Le, pos.x + 50, Strength.weak)
      // solver.createConstraint(this.minY, Operator.Ge, pos.y - 50, Strength.weak)
      // solver.createConstraint(this.minY, Operator.Le, pos.y + 50, Strength.weak)
    }

    // solver.addEditVariable(this.minX, isEditing ? Strength.strong : Strength.weak)
    // solver.addEditVariable(this.minY, isEditing ? Strength.strong : Strength.weak)
    // solver.suggestValue(this.minX, pos.x)
    // solver.suggestValue(this.minY, pos.y)

    if (parent) {
      parent.addChild(this)
    }
  }
}

class RectConstraints {
  readonly width = new kiwi.Variable()
  readonly height = new kiwi.Variable()

  readonly minX = new kiwi.Variable()
  readonly minY = new kiwi.Variable()
  readonly maxX = new kiwi.Expression(this.minX, this.width)
  readonly maxY = new kiwi.Expression(this.minY, this.height)
  readonly children = [] as RectConstraints[]

  get x() {
    return this.minX
  }
  get y() {
    return this.minY
  }

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
      solver.addEditVariable(this.minX, Strength.medium)
      solver.addEditVariable(this.minY, Strength.medium)
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
        solver.addEditVariable(this.minX, Strength.weak)
        solver.addEditVariable(this.minY, Strength.weak)
        solver.suggestValue(this.minX, pos.x)
        solver.suggestValue(this.minY, pos.y)
        // solver.createConstraint(this.minX, Operator.Eq, pos.x, Strength.weak)
        // solver.createConstraint(this.minY, Operator.Eq, pos.y, Strength.weak)
        solver.createConstraint(this.width, Operator.Eq, width, Strength.required)
        solver.createConstraint(this.height, Operator.Eq, height, Strength.required)
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

export function createLayoutConstraints(xynodes: XYFlowNode[], draggingNodeId: string) {
  const solver = new kiwi.Solver()
  const rects = new Map<string, Leaf | Compound>()

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

  const createZVar = () => {
    const z1 = new kiwi.Variable()
    solver.createConstraint(z1, Operator.Ge, 0)
    solver.createConstraint(z1, Operator.Le, 1)
    return z1
  }

  const M_X = 600
  const M_Y = 600

  if (hasAtLeast(rootRects, 2)) {
    let acc = 0
    for (const one of rootRects) {
      for (const two of rootRects) {
        if (one === two) {
          continue
        }
        const [z1, z2, z3, z4] = [createZVar(), createZVar(), createZVar(), createZVar()]

        // 𝑥2+𝑤2≤𝑥1+𝑀𝑧1
        solver.createConstraint(
          two.maxX,
          Operator.Le,
          one.x.plus(z1.multiply(M_X))
          // Strength.strong
        )

        // 𝑥1+𝑤1≤𝑥2+𝑀𝑧2
        solver.createConstraint(
          one.maxX,
          Operator.Le,
          two.x.plus(z2.multiply(M_X))
          // Strength.strong
        )

        // 𝑦1+ℎ1≤𝑦2+𝑀𝑧3
        solver.createConstraint(
          one.maxY,
          Operator.Le,
          two.y.plus(z3.multiply(M_Y))
          // Strength.strong
        )
        // 𝑦2+ℎ2≤𝑦1+𝑀𝑧4
        solver.createConstraint(
          two.maxY,
          Operator.Le,
          one.y.plus(z4.multiply(M_Y))
          // Strength.strong
        )

        // 𝑧1+𝑧2+𝑧3+𝑧4≤3
        solver.createConstraint(new Expr(z1, z2, z3, z4), Operator.Le, 3)

        acc = acc + 1
      }
    }
    // acc = rootRects.reduce((acc, one, i, all) => {
    //   if (i === all.length - 1) {
    //     return acc
    //   }
    //   for (let j = i + 1; j < all.length; j++) {
    //     const two = all[j]!

    //     const [z1,z2,z3,z4] = [createZVar(), createZVar(), createZVar(), createZVar()]

    //     // 𝑥2+𝑤2≤𝑥1+𝑀𝑧1
    //     solver.createConstraint(
    //       two.maxX,
    //       Operator.Le,
    //       one.x.plus(z1.multiply(M_X)),
    //       Strength.weak
    //     )

    //     // 𝑥1+𝑤1≤𝑥2+𝑀𝑧2
    //     solver.createConstraint(
    //       one.maxX,
    //       Operator.Le,
    //       two.x.plus(z2.multiply(M_X)),
    //       Strength.weak
    //     )

    //     // 𝑦1+ℎ1≤𝑦2+𝑀𝑧3
    //     solver.createConstraint(
    //       one.maxY,
    //       Operator.Le,
    //       two.y.plus(z3.multiply(M_Y)),
    //       Strength.weak
    //     )
    //     // 𝑦2+ℎ2≤𝑦1+𝑀𝑧4
    //     solver.createConstraint(
    //       two.maxY,
    //       Operator.Le,
    //       one.y.plus(z4.multiply(M_Y)),
    //       Strength.weak
    //     )

    //     // 𝑧1+𝑧2+𝑧3+𝑧4≤3
    //     solver.createConstraint(new Expr(z1,z2,z3,z4), Operator.Le, 3)

    //     acc = acc + 1
    //   }
    //   return acc
    // }, 0)
    console.log('processed', acc)
  }

  solver.updateVariables()

  // solver.maxIterations = 1000

  /**
   * Move the editing node to the given position.
   */
  function onNodeDrag(xynode: XYFlowNode) {
    const pos = nonNullable(xynode.computed?.positionAbsolute, 'No positionAbsolute')
    const rect = nonNullable(rects.get(xynode.id))
    solver.suggestValue(rect.minX, pos.x)
    solver.suggestValue(rect.minY, pos.y)
  }

  function calcNodePositions() {
    solver.updateVariables()
    return new Map([...rects.values()].map(rect => {
      return [rect.id, {
        position: rect.position,
        positionAbsolute: rect.positionAbsolute,
        width: rect.width.value(),
        height: rect.height.value()
      }]
    }))
  }

  return {
    onNodeDrag,
    calcNodePositions
  }
}
