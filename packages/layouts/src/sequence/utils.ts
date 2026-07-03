import type { DiagramNode } from '@likec4/core/types'
import { invariant, isAncestor, nonNullable, Stack } from '@likec4/core/utils'
import { groupBy, mapValues, pipe, values } from 'remeda'
import type { Compound, ParallelRect, Rect, Spacing, SpacingValue, Step } from './_types'

type Normalized = {
  padding: { left: number; right: number; top: number; bottom: number }
  margin: { top: number; bottom: number }
}

const paddingFromNumber = (spacing: number) => ({
  left: spacing,
  right: spacing,
  top: spacing,
  bottom: spacing,
})

function normalizePadding(padding: SpacingValue): Normalized['padding'] {
  if (typeof padding === 'number') {
    return paddingFromNumber(padding)
  }
  const left = padding?.left ?? padding?.x ?? 0
  const right = padding?.right ?? padding?.x ?? 0
  const top = padding?.top ?? padding?.y ?? 0
  const bottom = padding?.bottom ?? padding?.y ?? 0
  return { left, right, top, bottom }
}

const DefaultMargin = { top: 0, bottom: 0 }

function normalizeMargin(margin: number | { top?: number; bottom?: number }): Normalized['margin'] {
  if (margin === DefaultMargin) return DefaultMargin
  if (typeof margin === 'number') {
    return { top: margin, bottom: margin }
  }
  const top = margin.top ?? DefaultMargin.top
  const bottom = margin.bottom ?? DefaultMargin.bottom
  return { top, bottom }
}

export function normalizeSpacing(
  spacing: Spacing | number = 16,
): Normalized {
  if (typeof spacing === 'number') {
    return {
      padding: paddingFromNumber(spacing),
      margin: DefaultMargin,
    }
  }
  if (
    'top' in spacing
    || 'bottom' in spacing
    || 'left' in spacing || 'right' in spacing || 'x' in spacing ||
    'y' in spacing
  ) {
    return {
      padding: normalizePadding(spacing),
      margin: DefaultMargin,
    }
  }
  if ('padding' in spacing || 'margin' in spacing) {
    const { padding, margin } = spacing
    return {
      padding: normalizePadding(padding ?? 0),
      margin: normalizeMargin(margin ?? DefaultMargin),
    }
  }
  return {
    padding: normalizePadding(0),
    margin: DefaultMargin,
  }
}

export function rectFromSteps(steps: Array<Step>): Rect {
  invariant(steps.length > 0)
  return steps.reduce(
    (acc, step) => {
      acc.min.column = Math.min(acc.min.column, step.from.column, step.to.column)
      acc.min.row = Math.min(acc.min.row, step.from.row, step.to.row)

      acc.max.column = Math.max(acc.max.column, step.from.column, step.to.column)
      acc.max.row = Math.max(acc.max.row, step.from.row, step.to.row)

      return acc
    },
    {
      min: {
        column: Infinity,
        row: Infinity,
      },
      max: {
        column: -Infinity,
        row: -Infinity,
      },
    } as Rect,
  )
}

/**
 * From steps find boxes that must be marked as parallel on the layout
 */
export function findParallelRects(steps: Array<Step>): Array<ParallelRect> {
  return pipe(
    steps,
    groupBy(s => s.parent ?? undefined),
    mapValues((steps, parallelPrefix) => {
      return {
        ...rectFromSteps(steps),
        parallelPrefix,
      }
    }),
    values(),
  )
}

/**
 * Builds a tree of compounds from actors and nodes.
 * @param actors the actors in the sequence view
 * @param nodes the nodes in likec4 diagram
 * @returns an array of compounds where each compound is a node in the sequence view
 * that is an ancestor of one of the actors
 */
export function buildCompounds(actors: ReadonlyArray<DiagramNode>, nodes: ReadonlyArray<DiagramNode>): Array<Compound> {
  if (actors.length === 0 || actors.length === nodes.length) {
    return []
  }
  const getNode = (id: string) => nonNullable(nodes.find(n => n.id === id))
  function parentsLookup(node: DiagramNode): DiagramNode[] {
    const parent = node.parent ? getNode(node.parent) : null
    if (parent) {
      return [parent, ...parentsLookup(parent)]
    }
    return []
  }

  const stack = new Stack<Compound>()
  const result = [] as Array<Compound>

  actors.forEach(actor => {
    const _ancestors = parentsLookup(actor)
    if (_ancestors.length === 0) {
      stack.clear()
      return
    }
    const ancestors = Stack.from(_ancestors)
    let compound: DiagramNode | undefined
    let parent: DiagramNode | undefined
    while (true) {
      compound = stack.peek()?.node
      parent = ancestors.peek()
      if (!parent || !compound) {
        break
      }
      // Drop ancestors that are ancestors of the current compound
      if (isAncestor(parent.id, compound.id) || parent.id === compound.id) {
        ancestors.pop()
        continue
      }
      // Drop compounds that are not ancestors of the current parent
      if (!isAncestor(compound.id, parent.id)) {
        stack.pop()
        continue
      }
      break
    }

    // Add ancestors to the stack
    while ((parent = ancestors.pop())) {
      const parentAsCompound = {
        node: parent,
        from: actor,
        to: actor,
        nested: [],
      }
      let compound = stack.peek()
      if (!compound) {
        result.push(parentAsCompound)
      } else {
        compound.nested.push(parentAsCompound)
      }
      stack.push(parentAsCompound)
    }
    stack.forEach(c => c.to = actor)
  })

  return result
}
