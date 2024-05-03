import type { ComputedNode, Element, Fqn } from '@likec4/core'
import { compareByFqnHierarchically, DefaultElementShape, DefaultThemeColor, parentFqn } from '@likec4/core'

function updateDepthOfAncestors(node: ComputedNode, nodes: ReadonlyMap<Fqn, ComputedNode>) {
  let parentNd
  while (!!node.parent && (parentNd = nodes.get(node.parent))) {
    const depth = parentNd.depth ?? 1
    parentNd.depth = Math.max(depth, (node.depth ?? 0) + 1)
    if (parentNd.depth === depth) {
      // stop if we didn't change depth
      break
    }
    node = parentNd
  }
}

export function buildComputeNodes(elements: Iterable<Element>) {
  return (
    Array.from(elements)
      // Sort from Top to Bottom
      // So we can ensure that parent nodes are created before child nodes
      .sort(compareByFqnHierarchically)
      .reduce((map, { id, color, shape, ...el }) => {
        let parent = parentFqn(id)
        let level = 0
        // Find the first ancestor that is already in the map
        while (parent) {
          const parentNd = map.get(parent)
          if (parentNd) {
            // if parent has no children and we are about to add first one
            // we need to set its depth to 1
            if (parentNd.children.length == 0) {
              parentNd.depth = 1
              // go up the tree and update depth of all parents
              updateDepthOfAncestors(parentNd, map)
            }
            parentNd.children.push(id)
            level = parentNd.level + 1
            break
          }
          parent = parentFqn(parent)
        }
        const node: ComputedNode = {
          ...el,
          id,
          parent,
          level,
          color: color ?? DefaultThemeColor,
          shape: shape ?? DefaultElementShape,
          children: [],
          inEdges: [],
          outEdges: []
        }
        map.set(id, node)
        return map
      }, new Map<Fqn, ComputedNode>()) as ReadonlyMap<Fqn, ComputedNode>
  )
}
