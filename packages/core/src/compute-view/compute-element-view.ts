import { allPass, find } from 'remeda'
import { nonNullable } from '../errors'
import type { ModelIndex } from '../model-index'
import {
  DefaultElementShape,
  DefaultThemeColor,
  isViewRuleAutoLayout,
  isViewRuleStyle,
  type ComputedNode,
  type ComputedView,
  type Element,
  type ElementView,
  type Fqn
} from '../types'
import { compareByFqnHierarchically, isAncestor, isSameHierarchy, parentFqn } from '../utils'
import { EdgeBuilder } from './EdgeBuilder'
import { ComputeCtx } from './compute-ctx'
import { applyViewRuleStyles } from './utils/applyViewRuleStyles'
import { sortNodes } from './utils/sortNodes'

function reduceToMap(elementsIterator: Iterable<Element>) {
  return (
    Array.from(elementsIterator)
      // Sort from Top to Bottom
      // So we can ensure that parent nodes are created before child nodes
      .sort(compareByFqnHierarchically)
      .reduce((map, { id, color, shape, ...el }) => {
        let parent = parentFqn(id)
        let level = 0
        // Find the first ancestor that is already in the map
        while (parent) {
          if (map.has(parent)) {
            break
          }
          parent = parentFqn(parent)
        }
        if (parent) {
          const parentNd = nonNullable(map.get(parent))
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
          outEdges: []
        }
        map.set(id, node)
        return map
      }, new Map<Fqn, ComputedNode>()) as ReadonlyMap<Fqn, ComputedNode>
  )
}

const keepOriginalSortFromView = (_nodes: ReadonlyMap<Fqn, ComputedNode>, ctx: ComputeCtx) => {
  const nodes = [...ctx.allElements].flatMap(e => _nodes.get(e.id) || [])
  for (const node of nodes) {
    node.children = nodes.flatMap(n => (n.parent === node.id ? n.id : []))
  }
  return nodes
}

export function computeElementView(view: ElementView, index: ModelIndex): ComputedView {
  const ctx = ComputeCtx.create(view, index)

  // All "predicated" elements (including implicit ones)
  // Sorted from bottom to top
  const leafsFirst = [...ctx.allElements].sort((a, b) => -1 * compareByFqnHierarchically(a, b))

  // Elements from allElements, that have relatioships (edges)
  const elementsWithRelations = new Set<Element>()

  const edgeBuilder = new EdgeBuilder()

  const anscestorOf = (id: Fqn) => (e: Element) => e.id === id || isAncestor(e.id, id)

  // Step 1: Add explicit relations
  // Process relations from bottom to top
  const sortedRelations = [...ctx.relations]
  for (const rel of sortedRelations) {
    const source = find(leafsFirst, anscestorOf(rel.source))
    if (!source) {
      continue
    }
    const target = find(
      leafsFirst,
      allPass([anscestorOf(rel.target), e => !isSameHierarchy(e, source)])
    )
    if (!target) {
      continue
    }
    elementsWithRelations.add(source)
    elementsWithRelations.add(target)
    edgeBuilder.add(source.id, target.id, rel)
  }

  const nodesMap = reduceToMap(new Set([...ctx.elements, ...elementsWithRelations]))

  const edges = edgeBuilder.build().map(edge => {
    while (edge.parent) {
      if (nodesMap.has(edge.parent)) {
        break
      }
      edge.parent = parentFqn(edge.parent)
    }
    nonNullable(nodesMap.get(edge.source)).outEdges.push(edge.id)
    nonNullable(nodesMap.get(edge.target)).inEdges.push(edge.id)
    return edge
  })

  const nodes = applyViewRuleStyles(
    view.rules.filter(isViewRuleStyle),
    sortNodes(keepOriginalSortFromView(nodesMap, ctx), edges)
    // map(e => nodesMap.get(e.id)!, Array.from(elements))
  )

  const autoLayoutRule = view.rules.find(isViewRuleAutoLayout)
  return {
    ...view,
    autoLayout: autoLayoutRule?.autoLayout ?? 'TB',
    nodes,
    edges
  }
}
