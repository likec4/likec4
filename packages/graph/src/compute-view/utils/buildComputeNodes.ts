import type { ComputedNode, Element, Fqn } from '@likec4/core'
import {
  DefaultElementShape,
  DefaultThemeColor,
  compareByFqnHierarchically,
  parentFqn
} from '@likec4/core'

export const buildComputeNodes = (elements: Iterable<Element>) =>
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
