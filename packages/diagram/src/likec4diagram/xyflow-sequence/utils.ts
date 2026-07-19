import { type DiagramNode } from '@likec4/core/types'
import { invariant, isAncestor, nonNullable, Stack } from '@likec4/core/utils'
import { first, groupBy, hasAtLeast, last, mapValues, pipe, values } from 'remeda'
import { isAccessor } from 'typescript'
import type { Compound, ParallelRect, Rect, Spacing, Step } from './_types'

export type NormalizedSpacing = {
  left: number
  right: number
  top: number
  bottom: number
}

const paddingFromNumber = (spacing: number) => ({
  left: spacing,
  right: spacing,
  top: spacing,
  bottom: spacing,
})

export function normalizeSpacing(
  padding: Spacing | number = 16,
): NormalizedSpacing {
  if (typeof padding === 'number') {
    return paddingFromNumber(padding)
  }
  const left = padding?.left ?? padding?.x ?? 0
  const right = padding?.right ?? padding?.x ?? 0
  const top = padding?.top ?? padding?.y ?? 0
  const bottom = padding?.bottom ?? padding?.y ?? 0
  return { left, right, top, bottom }
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
  const getNode = (id: string) => nodes.find(n => n.id === id)
  function parentsLookup(node: DiagramNode): DiagramNode[] {
    const parent = node.parent && getNode(node.parent)
    if (parent) {
      return [parent, ...parentsLookup(parent)]
    }
    return []
  }

  const stack = new Stack<Compound>()
  const result = [] as Array<Compound>

  actors.forEach(actor => {
    const parents = parentsLookup(actor)
    if (parents.length === 0) {
      stack.clear()
      return
    }

    let head: DiagramNode | undefined
    let parent = parents[0]
    // Fist we check current stack
    // We pop elements from stack that are not ancestors of the current parent
    while ((head = stack.peek()?.node)) {
      if (!parent || head.id === parent.id) {
        // Clear ancestors array, stack head is already in the result
        parents.length = 0
        break
      }
      // Drop compounds that are not ancestors of the current parent
      if (!isAncestor(head.id, parent.id)) {
        stack.pop()
        continue
      }
      break
    }

    // Add ancestors to the stack
    while ((head = parents.pop())) {
      let compound = stack.peek()

      // Skip if this ancestor is already in the stack as a nested compound
      if (compound && (isAncestor(head.id, compound.node.id) || head.id === compound.node.id)) {
        continue
      }

      const parentAsCompound = {
        node: head,
        from: actor,
        to: actor,
        nested: [],
      }
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
