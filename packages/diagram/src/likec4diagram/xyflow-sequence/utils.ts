import type { DiagramNode } from '@likec4/core/types'
import { isAncestor, nonNullable, Stack } from '@likec4/core/utils'
import { groupBy, mapValues, pipe, values } from 'remeda'
import type { Compound, ParallelRect, Step } from './_types'

/**
 * From steps find boxes that must be marked as parallel on the layout
 */
export function findParallelRects(steps: Array<Step>): Array<ParallelRect> {
  return pipe(
    steps,
    groupBy(s => s.parallelPrefix ?? undefined),
    mapValues((steps, parallelPrefix) => {
      return steps.reduce(
        (acc, step) => {
          acc.min.column = Math.min(acc.min.column, step.from.column, step.to.column)
          acc.min.row = Math.min(acc.min.row, step.from.row, step.to.row)

          acc.max.column = Math.max(acc.max.column, step.from.column, step.to.column)
          acc.max.row = Math.max(acc.max.row, step.from.row, step.to.row)

          return acc
        },
        {
          parallelPrefix,
          min: {
            column: Infinity,
            row: Infinity,
          },
          max: {
            column: -Infinity,
            row: -Infinity,
          },
        } as ParallelRect,
      )
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
