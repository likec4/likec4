import type { Except } from 'type-fest'
import type { ElementModel } from '../../model'
import { defaultStyles } from '../../theme'
import {
  type AnyAux,
  type aux,
  type ComputedNode,
  type scalar,
  type Unknown,
  GroupElementKind,
  omitUndefined,
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
    summary, // omit
    style,
    metadata, // omit
    ...rest
  } = el.$element
  return omitUndefined({
    id: id as scalar.NodeId,
    modelRef: id,
    ...rest,
    style: { ...el.style },
    color: el.color,
    shape: el.shape,
    description: preferSummary(el.$element),
    tags: [...el.tags],
  })
}

export function buildComputedNodes<A extends AnyAux>(
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
      description: null,
      technology: null,
      color: viewRule.color ?? 'muted',
      shape: 'rectangle',
      children: [],
      inEdges: [],
      outEdges: [],
      level: 0,
      depth: 0,
      tags: [],
      style: {
        border: viewRule.border ?? 'dashed',
        opacity: viewRule.opacity ?? 0,
        size: viewRule.size ?? 'md',
        multiple: viewRule.multiple ?? false,
        padding: viewRule.padding ?? 'md',
        textSize: viewRule.textSize ?? 'md',
      },
    })
    for (const e of elements) {
      elementToGroup.set(e.id, id)
    }
  })

  // Ensure that parent nodes are created before child nodes
  Array.from(elements)
    .sort(compareByFqnHierarchically)
    .forEach(({ id, style, kind, title, color, shape, tags, notation, ...el }) => {
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
      const node: ComputedNode<A> = {
        id,
        parent,
        kind,
        title,
        description: null,
        technology: null,
        level,
        color: color ?? defaultStyles.color,
        shape: shape ?? defaultStyles.element.shape,
        tags: tags ?? [],
        children: [],
        inEdges: [],
        outEdges: [],
        ...notation && { notation },
        ...el,
        style: {
          ...style,
        },
      }
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
