import type { ComputedNode, Element, Fqn, NodeId } from '@likec4/core'
import { compareByFqnHierarchically, DefaultElementShape, DefaultThemeColor, parentFqn } from '@likec4/core'
import { AdHocGroup } from '../compute-view/compute'

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

export function buildComputeNodes(elements: Iterable<Element>, groups?: AdHocGroup[]) {
  const nodesMap = new Map<Fqn, ComputedNode>()

  const elementToGroup = new Map<Fqn, NodeId>()

  groups?.forEach(group => {
    if (group.parent) {
      nodesMap.get(group.parent)?.children.push(group.id)
    }
    nodesMap.set(group.id, {
      id: group.id,
      kind: AdHocGroup.kind,
      title: group.title || '',
      description: null,
      technology: null,
      tags: null,
      links: null,
      parent: group.parent,
      level: 0,
      color: 'gray',
      shape: 'rectangle',
      children: [],
      inEdges: [],
      outEdges: [],
      style: {
        border: 'dashed',
        opacity: .5
      }
    })
    group.explicits.forEach(e => elementToGroup.set(e.id, group.id))
  })

  return (
    Array.from(elements)
      // Sort from Top to Bottom
      // So we can ensure that parent nodes are created before child nodes
      .sort(compareByFqnHierarchically)
      .reduce((map, { id, color, shape, style, ...el }) => {
        let parent = parentFqn(id)
        let level = 0
        let parentNd: ComputedNode | undefined
        // Find the first ancestor that is already in the map
        while (parent) {
          parentNd = map.get(parent)
          if (parentNd) {
            break
          }
          parent = parentFqn(parent)
        }
        if (!parentNd && elementToGroup.has(id)) {
          parent = elementToGroup.get(id)!
          parentNd = map.get(parent)!
        }
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
          outEdges: [],
          style: {
            ...style
          }
        }
        map.set(id, node)
        return map
      }, nodesMap) as ReadonlyMap<Fqn, ComputedNode>
  )
}
