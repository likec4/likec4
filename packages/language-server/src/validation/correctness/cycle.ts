import { type ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

function reconstructCycle(
  detectionPoint: string,
  backEdgeTarget: string,
  parent: Map<string, string | undefined>,
): string[] {
  const cycle = [detectionPoint]

  // Add the back edge: detectionPoint -> backEdgeTarget
  cycle.push(backEdgeTarget)

  // Build path from backEdgeTarget back to detectionPoint via DFS tree
  let current = backEdgeTarget
  while (current !== detectionPoint) {
    const parentNode = parent.get(current)
    if (!parentNode) {
      // Fallback in case of incomplete parent mapping
      break
    }
    current = parentNode
    if (current !== detectionPoint) {
      cycle.push(current)
    }
  }

  // Add the detection point at the end to complete the cycle
  cycle.push(detectionPoint)
  return cycle
}

export const checkCyclicDependencies = (services: LikeC4Services): ValidationCheck<ast.LikeC4Grammar> => {
  return tryOrLog((grammar, accept) => {
    if (!grammar || grammar.$type !== 'LikeC4Grammar') {
      return
    }

    const fqnIndex = services.likec4.FqnIndex

    // Collect all elements and relations
    const elementMap = new Map<string, ast.Element>()
    const relationships: { source: string; target: string; relation: ast.Relation }[] = []

    // Helper function to recursively collect all elements (including nested)
    const collectElements = (elements: readonly (ast.Element | ast.Relation | ast.ExtendElement)[]) => {
      for (const statement of elements) {
        if (ast.isElement(statement)) {
          const element = statement as ast.Element
          const fqn = fqnIndex.getFqn(element)
          if (fqn) {
            elementMap.set(fqn, element)
          }
          // Recursively collect nested elements
          if (element.body?.elements) {
            collectElements(element.body.elements)
          }
        }
      }
    }

    // First pass: collect all elements (including nested)
    for (const model of grammar.models) {
      if (!model.elements) continue
      collectElements(model.elements)
    }

    // Helper function to recursively collect relationships
    const collectRelationships = (elements: readonly (ast.Element | ast.Relation | ast.ExtendElement)[]) => {
      for (const statement of elements) {
        if (ast.isRelation(statement)) {
          const relation = statement as ast.Relation

          let sourceFqn: string | null = null
          let targetFqn: string | null = null

          // Get source FQN
          if (relation.source && relation.source.value.ref && ast.isElement(relation.source.value.ref)) {
            sourceFqn = fqnIndex.getFqn(relation.source.value.ref)
          }

          // Get target FQN
          if (relation.target && relation.target.value.ref && ast.isElement(relation.target.value.ref)) {
            targetFqn = fqnIndex.getFqn(relation.target.value.ref)
          }

          if (sourceFqn && targetFqn) {
            relationships.push({ source: sourceFqn, target: targetFqn, relation })
          }
        } else if (ast.isElement(statement)) {
          // Recursively collect relationships from nested elements
          const element = statement as ast.Element
          if (element.body?.elements) {
            collectRelationships(element.body.elements)
          }
        }
      }
    }

    // Second pass: collect all relationships (including nested ones)
    for (const model of grammar.models) {
      if (!model.elements) continue
      collectRelationships(model.elements)
    }

    if (relationships.length === 0) {
      return
    }

    // Build adjacency list
    const graph = new Map<string, string[]>()
    for (const [fqn] of elementMap) {
      graph.set(fqn, [])
    }

    for (const rel of relationships) {
      if (graph.has(rel.source) && graph.has(rel.target)) {
        graph.get(rel.source)!.push(rel.target)
      }
    }

    // DFS-based cycle detection using colors
    // 0 = white (unvisited), 1 = gray (visiting), 2 = black (visited)
    const colors = new Map<string, number>()
    const parent = new Map<string, string | null>()

    for (const fqn of Array.from(graph.keys())) {
      colors.set(fqn, 0)
      parent.set(fqn, null)
    }

    function dfs(nodeId: string): string[] | null {
      colors.set(nodeId, 1) // Mark as gray (visiting)

      const neighbors = graph.get(nodeId) || []
      for (const neighbor of neighbors) {
        if (colors.get(neighbor) === 1) {
          // Found a back edge - cycle detected
          // nodeId is the detection point, so cycle should start from nodeId
          return reconstructCycle(nodeId, neighbor, parent as Map<string, string | undefined>)
        }

        if (colors.get(neighbor) === 0) {
          parent.set(neighbor, nodeId)
          const cycleFound = dfs(neighbor)
          if (cycleFound) {
            return cycleFound
          }
        }
      }

      colors.set(nodeId, 2) // Mark as black (visited)
      return null
    }

    // Check each unvisited node
    for (const nodeId of Array.from(graph.keys())) {
      if (colors.get(nodeId) === 0) {
        const cycle = dfs(nodeId)
        if (cycle && cycle.length > 0) {
          const cycleDescription = cycle.join(' → ')
          // Find the first element in the cycle to attach the error to
          const firstElement = elementMap.get(cycle[0]!)
          if (firstElement) {
            accept('warning', `Cyclic dependency detected: ${cycleDescription}`, {
              node: firstElement,
              property: 'name',
              code: 'cyclic-dependency',
            })
          }
          return // Report only the first cycle found
        }
      }
    }
  })
}
