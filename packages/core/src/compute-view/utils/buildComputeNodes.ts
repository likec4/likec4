import { nonNullable } from '../../errors'
import {
  type ComputedNode,
  DefaultElementShape,
  DefaultThemeColor,
  type Element,
  ElementKind,
  type Fqn,
  type NodeId
} from '../../types'
import { compareByFqnHierarchically, parentFqn } from '../../utils/fqn'
import { NodesGroup } from '../element-view/compute'

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

export function buildComputeNodes(elements: Iterable<Element>, groups?: NodesGroup[]) {
  const nodesMap = new Map<Fqn, ComputedNode>()

  const elementToGroup = new Map<Fqn, NodeId>()

  groups?.forEach(({ id, parent, viewRule, explicits }) => {
    if (parent) {
      nonNullable(nodesMap.get(parent), `Parent group node ${parent} not found`).children.push(id)
    }
    nodesMap.set(id, {
      id,
      parent,
      kind: ElementKind.Group,
      title: viewRule.title ?? '',
      color: viewRule.color ?? 'muted',
      shape: 'rectangle',
      children: [],
      inEdges: [],
      outEdges: [],
      level: 0,
      depth: 0,
      description: null,
      technology: null,
      tags: null,
      links: null,
      style: {
        border: viewRule.border ?? 'dashed',
        opacity: viewRule.opacity ?? 0
      }
    })
    for (const e of explicits) {
      elementToGroup.set(e.id, id)
    }
  })

  return (
    Array.from(elements)
      // Sort from Top to Bottom
      // So we can ensure that parent nodes are created before child nodes
      .sort(compareByFqnHierarchically)
      .reduce((map, { id, color, shape, style, kind, title, ...el }) => {
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
        // If parent is not found in the map, check if it is in a group
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
          id,
          parent,
          kind,
          title,
          color: color ?? DefaultThemeColor,
          shape: shape ?? DefaultElementShape,
          children: [],
          inEdges: [],
          outEdges: [],
          level,
          ...el,
          style: {
            ...style
          }
        }
        map.set(id, node)
        return map
      }, nodesMap) as ReadonlyMap<Fqn, ComputedNode>
  )
}
