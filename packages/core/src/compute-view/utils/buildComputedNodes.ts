import { omit } from 'remeda'
import type { Except } from 'type-fest'
import type { ElementModel } from '../../model'
import {
  type AnyAux,
  type aux,
  type ComputedNode,
  type LikeC4StylesConfig,
  type scalar,
  type Unknown,
  exact,
  GroupElementKind,
  preferSummary,
} from '../../types'
import { nonNullable } from '../../utils'
import { compareByFqnHierarchically, parentFqn } from '../../utils/fqn'
import { NodesGroup } from '../element-view/memory'

function updateDepthOfAncestors(node: ComputedNode, nodes: ReadonlyMap<string, ComputedNode>) {
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

export type ComputedNodeSource<A extends AnyAux = Unknown> = Except<
  ComputedNode<A>,
  'parent' | 'children' | 'inEdges' | 'outEdges' | 'level' | 'depth',
  { requireExactProps: true }
>

export function elementModelToNodeSource<A extends AnyAux>(el: ElementModel<A>): ComputedNodeSource<A> {
  const {
    id,
    title,
    ...rest
  } = omit(el.$element, ['summary', 'description', 'metadata', 'style', 'tags'])
  const { color, icon, shape, ...style } = el.style
  return exact({
    id: id as scalar.NodeId,
    title,
    modelRef: id,
    shape,
    color,
    icon,
    style,
    description: preferSummary(el.$element),
    tags: [...el.tags],
    ...rest,
  })
}

export function buildComputedNodes<A extends AnyAux>(
  { defaults }: LikeC4StylesConfig,
  elements: ReadonlyArray<ComputedNodeSource<A>>,
  groups?: ReadonlyArray<NodesGroup<A>>,
): ReadonlyMap<scalar.NodeId, ComputedNode<A>> {
  const nodesMap = new Map<scalar.NodeId, ComputedNode<A>>()

  const elementToGroup = new Map<aux.StrictFqn<A>, scalar.NodeId>()

  groups?.forEach(({ id, parent, viewRule, elements }) => {
    if (parent) {
      nonNullable(nodesMap.get(parent), `Parent group node ${parent} not found`).children.push(id)
    }
    nodesMap.set(id, {
      id,
      parent,
      kind: GroupElementKind,
      title: viewRule.title ?? '',
      color: viewRule.color ?? defaults.group?.color ?? defaults.color,
      shape: 'rectangle',
      children: [],
      inEdges: [],
      outEdges: [],
      level: 0,
      depth: 0,
      tags: [],
      style: exact({
        border: viewRule.border ?? defaults.group?.border ?? defaults.border,
        opacity: viewRule.opacity ?? defaults.group?.opacity ?? defaults.opacity,
        size: viewRule.size,
        multiple: viewRule.multiple,
        padding: viewRule.padding,
        textSize: viewRule.textSize,
      }),
    })
    for (const e of elements) {
      elementToGroup.set(e.id, id)
    }
  })

  // Ensure that parent nodes are created before child nodes
  Array.from(elements)
    .sort(compareByFqnHierarchically)
    .forEach(({ id, ...el }) => {
      let parent = parentFqn(id)
      let level = 0
      let parentNd: ComputedNode<A> | undefined
      // Find the first ancestor that is already in the map
      while (parent) {
        parentNd = nodesMap.get(parent)
        if (parentNd) {
          break
        }
        parent = parentFqn(parent)
      }
      const fqn = el.modelRef ?? id as unknown as aux.StrictFqn<A>
      // If parent is not found in the map, check if it is in a group
      if (!parentNd && elementToGroup.has(fqn)) {
        const parentGroupId = nonNullable(elementToGroup.get(fqn))
        parentNd = nodesMap.get(parentGroupId)
        parent = parentGroupId
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
      const node: ComputedNode<A> = exact({
        id,
        parent,
        level,
        children: [],
        inEdges: [],
        outEdges: [],
        ...el,
      })
      nodesMap.set(id, node)
    })

  // Create new map and add elements in the same order as they were in the input
  const orderedMap = new Map<aux.NodeId, ComputedNode<A>>()

  groups?.forEach(({ id }) => {
    orderedMap.set(id, nonNullable(nodesMap.get(id)))
  })
  elements.forEach(({ id }) => {
    orderedMap.set(id, nonNullable(nodesMap.get(id)))
  })

  return orderedMap
}
