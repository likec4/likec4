import type { Simplify } from 'type-fest'
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

const modelElementAsNodeSource = (element: Element): ComputedNodeSource => {
  return {
    ...element,
    modelRef: 1
  }
}

// type ComputedNodeSource = Simplify<SetRequired<Partial<Omit<ComputedNode, 'parent' | 'children' | 'inEdges' | 'outEdges' | 'level' | 'depth'>>, 'id' | 'title' | 'kind'>>
export type ComputedNodeSource = Simplify<
  & Pick<ComputedNode, 'id' | 'title' | 'kind' | 'deploymentRef' | 'modelRef'>
  & Partial<Omit<Element, 'id' | 'title' | 'kind'>>
>

export function buildComputedNodesFromElements(elements: ReadonlyArray<Element>, groups?: NodesGroup[]) {
  return buildComputedNodes(elements.map(modelElementAsNodeSource), groups)
}

export function buildComputedNodes(
  elements: ReadonlyArray<ComputedNodeSource>,
  groups?: NodesGroup[]
): ReadonlyMap<Fqn, ComputedNode> {
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

  // Ensure that parent nodes are created before child nodes
  Array.from(elements)
    .sort(compareByFqnHierarchically)
    .forEach(({ id, style, kind, title, color, shape, ...el }) => {
      let parent = parentFqn(id)
      let level = 0
      let parentNd: ComputedNode | undefined
      // Find the first ancestor that is already in the map
      while (parent) {
        parentNd = nodesMap.get(parent)
        if (parentNd) {
          break
        }
        parent = parentFqn(parent)
      }
      // If parent is not found in the map, check if it is in a group
      if (!parentNd && elementToGroup.has(id)) {
        parent = elementToGroup.get(id)!
        parentNd = nodesMap.get(parent)!
      }
      if (parentNd) {
        // if parent has no children and we are about to add first one
        // we need to set its depth to 1
        if (parentNd.children.length == 0) {
          parentNd.depth = 1
          // go up the tree and update depth of all parents
          updateDepthOfAncestors(parentNd, nodesMap)
        }
        parentNd.children.push(id)
        level = parentNd.level + 1
      }
      const node: ComputedNode = {
        id,
        parent,
        kind,
        title,
        level,
        color: color ?? DefaultThemeColor,
        shape: shape ?? DefaultElementShape,
        description: null,
        technology: null,
        tags: null,
        links: null,
        children: [],
        inEdges: [],
        outEdges: [],
        ...el,
        style: {
          ...style
        }
      }
      nodesMap.set(id, node)
    })

  // Create new map and add elements in the same order as they were in the input
  const orderedMap = new Map<Fqn, ComputedNode>()

  groups?.forEach(({ id }) => {
    orderedMap.set(id, nonNullable(nodesMap.get(id)))
  })
  elements.forEach(({ id }) => {
    orderedMap.set(id, nonNullable(nodesMap.get(id)))
  })

  return orderedMap
}
