import { allPass, find } from 'remeda'
import { nonNullable, nonexhaustive } from '../errors'
import type { ModelIndex } from '../model-index'
import {
  DefaultElementShape,
  DefaultThemeColor,
  Expr,
  isViewRuleAutoLayout,
  isViewRuleExpression,
  isViewRuleStyle,
  type ComputedNode,
  type Element,
  type ElementView,
  type Fqn,
  type ComputedView
} from '../types'
import { compareByFqnHierarchically, isAncestor, isSameHierarchy, parentFqn } from '../utils'
import { EdgeBuilder } from './EdgeBuilder'
import { ComputeCtx } from './compute-ctx'
import {
  excludeElementKindOrTag,
  excludeElementRef,
  excludeInOutExpr,
  excludeIncomingExpr,
  excludeOutgoingExpr,
  excludeRelationExpr,
  excludeWildcardRef,
  includeElementKindOrTag,
  includeElementRef,
  includeInOutExpr,
  includeIncomingExpr,
  includeOutgoingExpr,
  includeRelationExpr,
  includeWildcardRef
} from './compute-predicates'
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
        }
        const node: ComputedNode = {
          ...el,
          id,
          parent,
          color: color ?? DefaultThemeColor,
          shape: shape ?? DefaultElementShape,
          children: [],
          inEdges: [],
          outEdges: []
        }
        map.set(id, node)
        return map
      }, new Map<Fqn, ComputedNode>())
  )
}

export function computeElementView(view: ElementView, index: ModelIndex): ComputedView {
  const rootElement = view.viewOf ?? null
  let ctx = new ComputeCtx(index, rootElement)
  const rulesInclude = view.rules.filter(isViewRuleExpression)
  if (rootElement && rulesInclude.length == 0) {
    ctx = ctx.include({
      elements: [index.find(rootElement)]
    })
  }
  for (const { isInclude, exprs } of rulesInclude) {
    for (const expr of exprs) {
      if (Expr.isElementKindExpr(expr) || Expr.isElementTagExpr(expr)) {
        ctx = isInclude ? includeElementKindOrTag(ctx, expr) : excludeElementKindOrTag(ctx, expr)
        continue
      }
      if (Expr.isElementRef(expr)) {
        ctx = isInclude ? includeElementRef(ctx, expr) : excludeElementRef(ctx, expr)
        continue
      }
      if (Expr.isWildcard(expr)) {
        ctx = isInclude ? includeWildcardRef(ctx, expr) : excludeWildcardRef(ctx, expr)
        continue
      }
      if (Expr.isIncoming(expr)) {
        ctx = isInclude ? includeIncomingExpr(ctx, expr) : excludeIncomingExpr(ctx, expr)
        continue
      }
      if (Expr.isOutgoing(expr)) {
        ctx = isInclude ? includeOutgoingExpr(ctx, expr) : excludeOutgoingExpr(ctx, expr)
        continue
      }
      if (Expr.isInOut(expr)) {
        ctx = isInclude ? includeInOutExpr(ctx, expr) : excludeInOutExpr(ctx, expr)
        continue
      }
      if (Expr.isRelation(expr)) {
        ctx = isInclude ? includeRelationExpr(ctx, expr) : excludeRelationExpr(ctx, expr)
        continue
      }
      nonexhaustive(expr)
    }
  }
  // All "predicated" elements (including implicit ones)
  // From bottom to top
  const allElements = [...ctx.elements, ...ctx.implicits].sort(compareByFqnHierarchically).reverse()

  // Elements from allElements, that have relatioships (edges)
  const elementsWithRelations = new Set<Element>()

  const edgeBuilder = new EdgeBuilder()

  const anscestorOf = (id: Fqn) => (e: Element) => e.id === id || isAncestor(e.id, id)

  // Step 1: Add explicit relations
  // Process relations from bottom to top
  const sortedRelations = [...ctx.relations]
  for (const rel of sortedRelations) {
    const source = find(allElements, anscestorOf(rel.source))
    if (!source) {
      continue
    }
    const target = find(
      allElements,
      allPass([anscestorOf(rel.target), e => !isSameHierarchy(e, source)])
    )
    if (!target) {
      continue
    }
    elementsWithRelations.add(source)
    elementsWithRelations.add(target)
    edgeBuilder.add(source.id, target.id, rel)
  }

  const elements = new Set([...ctx.elements, ...elementsWithRelations])

  const nodesMap = reduceToMap(elements)

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
    sortNodes(nodesMap, edges)
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
