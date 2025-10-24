import type { ComputedBranchCollection, DiagramNode } from '@likec4/core/types'
import { isAncestor, nonNullable, Stack } from '@likec4/core/utils'
import type { Compound, ParallelRect, Step } from './_types'

/**
 * From steps find boxes that must be marked as parallel on the layout
 */
export function findParallelRects(
  steps: Array<Step>,
  options?: {
    branchCollections?: ReadonlyArray<ComputedBranchCollection<any>>
  },
): Array<ParallelRect> {
  const rects = new Map<string, ParallelRect>()
  const branchLookup = new Map<string, ComputedBranchCollection<any>>()

  for (const branch of options?.branchCollections ?? []) {
    branchLookup.set(branch.branchId, branch)
  }

  const ensureRect = (key: string, init: () => ParallelRect): ParallelRect => {
    const existing = rects.get(key)
    if (existing) {
      return existing
    }
    const created = init()
    rects.set(key, created)
    return created
  }

  for (const step of steps) {
    const { from, to } = step
    const updateBounds = (rect: ParallelRect) => {
      rect.min.column = Math.min(rect.min.column, from.column, to.column)
      rect.min.row = Math.min(rect.min.row, from.row, to.row)
      rect.max.column = Math.max(rect.max.column, from.column, to.column)
      rect.max.row = Math.max(rect.max.row, from.row, to.row)
    }

    const trail = step.edge.branchTrail
    if (trail && trail.length > 0) {
      for (const entry of trail) {
        const key = `branch:${entry.branchId}|${entry.pathId}`
        const branch = branchLookup.get(entry.branchId)
        const pathInfo = branch?.paths.find(p => p.pathId === entry.pathId)
        const rect = ensureRect(key, () => ({
          parallelPrefix: step.parallelPrefix ?? entry.branchId,
          branchId: entry.branchId,
          branchLabel: branch?.label ?? null,
          pathId: entry.pathId,
          pathIndex: entry.pathIndex,
          pathName: entry.pathName ?? pathInfo?.pathName ?? null,
          pathTitle: entry.pathTitle ?? pathInfo?.pathTitle ?? null,
          kind: entry.kind,
          isDefaultPath: entry.isDefaultPath ?? pathInfo?.isDefaultPath ?? false,
          min: {
            column: Infinity,
            row: Infinity,
          },
          max: {
            column: -Infinity,
            row: -Infinity,
          },
        }))
        updateBounds(rect)
      }
      continue
    }

    const prefix = step.parallelPrefix
    if (!prefix) {
      continue
    }
    const rect = ensureRect(`parallel:${prefix}`, () => ({
      parallelPrefix: prefix,
      min: {
        column: Infinity,
        row: Infinity,
      },
      max: {
        column: -Infinity,
        row: -Infinity,
      },
    }))
    updateBounds(rect)
  }

  return [...rects.values()]
}

/**
 * Builds a tree of compounds from actors and nodes.
 * @param actors the actors in the sequence view
 * @param nodes the nodes in likec4 diagram
 * @returns an array of compounds where each compound is a node in the sequence view
 * that is an ancestor of one of the actors
 */
export function buildCompounds(actors: Array<DiagramNode>, nodes: Array<DiagramNode>): Array<Compound> {
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
