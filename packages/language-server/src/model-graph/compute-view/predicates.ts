import type { Element, Relation } from '@likec4/core'
import { Expr, isAncestor, nonexhaustive, parentFqn } from '@likec4/core'
import { allPass, filter as remedaFilter, flatMap, isNullish as isNil, map, pipe, unique } from 'remeda'
import { elementExprToPredicate } from '../utils/elementExpressionToPredicate'
import type { ComputeCtx } from './compute'

type Predicate<T> = (x: T) => boolean
export type ElementPredicateFn = Predicate<Element>
export type RelationPredicateFn = Predicate<Relation>
// // type ElementPredicate = Predicate<Element>
// type ElementPredicates<T> = T extends Element[] ? (x: T) => T : (T extends Element ? (x: T) => (Element | null) : never)
// type ElementPredicate = ElementPredicates<Element | Element[]>

const NoFilter: ElementPredicateFn = () => true
const Identity = <T>(x: T) => x
const filterBy = <T>(pred: Predicate<T>) => pred === NoFilter ? Identity : remedaFilter(pred)
const filterOne = <T>(pred: Predicate<T>) => pred === NoFilter ? Identity : (x: T) => pred(x) ? x : null

export function includeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr, where = NoFilter) {
  // Get the elements that are already in the Ctx before any mutations
  // Because we need to add edges between them and the new elements
  const currentElements = [...this.resolvedElements]
  const filter = filterBy(where)

  const elements = filter(
    expr.isDescedants === true
      ? this.graph.childrenOrElement(expr.element)
      : [this.graph.element(expr.element)]
  )
  if (elements.length === 0) {
    return
  }

  this.addElement(...elements)

  if (elements.length > 1) {
    this.addEdges(this.graph.edgesWithin(elements))
  }

  if (currentElements.length > 0 && elements.length > 0) {
    for (const el of elements) {
      this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
    }
  }
}

export function excludeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr, where = NoFilter) {
  const elements = [...this.resolvedElements].filter(allPass([
    elementExprToPredicate(expr),
    where
  ]))
  this.excludeElement(...elements)
}

export function includeWildcardRef(this: ComputeCtx, _expr: Expr.WildcardExpr, where = NoFilter) {
  const root = this.root
  if (!root) {
    // Take root elements
    const elements = this.graph.rootElements.filter(where)
    if (elements.length <= 0) {
      return
    }
    const currentElements = [...this.resolvedElements]
    this.addElement(...elements)
    this.addEdges(this.graph.edgesWithin(elements))
    if (currentElements.length > 0) {
      for (const el of elements) {
        this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
      }
    }
    return
  }

  const currentElements = [...this.resolvedElements]
  const _elRoot = filterOne(where)(this.graph.element(root))
  if (_elRoot) {
    this.addElement(_elRoot)
  }
  const filter = filterBy(where)

  const children = filter(this.graph.children(root))
  const hasChildren = children.length > 0
  if (hasChildren) {
    this.addElement(...children)
    this.addEdges(this.graph.edgesWithin(children))
  } else if (_elRoot) {
    children.push(_elRoot)
  }

  // All neighbours that may have relations with root or its children
  const neighbours = [
    ...currentElements,
    ...filter([
      ...this.graph.siblings(root),
      ...this.graph.ancestors(root).flatMap(a => this.graph.siblings(a.id))
    ])
  ]

  for (const el of children) {
    this.addEdges(this.graph.anyEdgesBetween(el, neighbours)).forEach(edge => {
      this.addImplicit(edge.source, edge.target)
    })
  }

  // If root has no children
  if (!hasChildren && _elRoot) {
    // Any edges with siblings?
    const edgesWithSiblings = this.graph.anyEdgesBetween(_elRoot, this.graph.siblings(root))
    if (edgesWithSiblings.length === 0) {
      // If no edges with siblings, i.e. root is orphan
      // Lets add parent for better view
      const _parentId = parentFqn(root)
      const parent = _parentId && this.graph.element(_parentId)
      if (parent && where(parent)) {
        this.addElement(parent)
      }
    }
  }
}

export function excludeWildcardRef(this: ComputeCtx, _expr: Expr.WildcardExpr, where = NoFilter) {
  if (where !== NoFilter) {
    const elements = [...this.resolvedElements].filter(where)
    this.excludeElement(...elements)
    return
  }
  const root = this.root
  if (root) {
    this.excludeElement(
      this.graph.element(root),
      ...this.graph.children(root)
    )
    this.excludeRelation(
      ...this.graph.connectedRelations(root)
    )
  } else {
    this.reset()
  }
}

export function includeExpandedElementExpr(
  this: ComputeCtx,
  expr: Expr.ExpandedElementExpr,
  where = NoFilter
) {
  const filter = filterBy(where)
  const currentElements = [...this.resolvedElements]

  // Always add parent
  const parent = this.graph.element(expr.expanded)
  if (where(parent)) {
    this.addElement(parent)
    const anyEdgesBetween = this.graph.anyEdgesBetween(parent, currentElements)
    this.addEdges(anyEdgesBetween)
  }

  const expanded = [] as Element[]

  for (const el of filter(this.graph.children(expr.expanded))) {
    this.addImplicit(el)
    const edges = this.graph.anyEdgesBetween(el, currentElements)
    if (edges.length > 0) {
      this.addEdges(edges)
      expanded.push(el)
    }
  }
  if (expanded.length > 1) {
    this.addEdges(this.graph.edgesWithin(expanded))
  }
}

export function excludeExpandedElementExpr(
  this: ComputeCtx,
  expr: Expr.ExpandedElementExpr,
  where = NoFilter
) {
  const elements = [...this.resolvedElements].filter(allPass([
    elementExprToPredicate(expr),
    where
  ]))
  this.excludeElement(...elements)
}

const asElementPredicate = (
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
): Predicate<Element> => {
  if (expr.isEqual) {
    if (Expr.isElementKindExpr(expr)) {
      return e => e.kind === expr.elementKind
    } else {
      return ({ tags }) => !!tags && tags.includes(expr.elementTag)
    }
  } else {
    if (Expr.isElementKindExpr(expr)) {
      return e => e.kind !== expr.elementKind
    } else {
      return ({ tags }) => isNil(tags) || tags.length === 0 || !tags.includes(expr.elementTag)
    }
  }
}
export function includeElementKindOrTag(
  this: ComputeCtx,
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr,
  where = NoFilter
) {
  const elements = this.graph.elements.filter(asElementPredicate(expr)).filter(where)
  if (elements.length > 0) {
    const currentElements = [...this.resolvedElements]
    this.addElement(...elements)
    this.addEdges(this.graph.edgesWithin(elements))
    for (const el of elements) {
      this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
    }
  }
}

export function excludeElementKindOrTag(
  this: ComputeCtx,
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr,
  where = NoFilter
) {
  const elements = [...this.resolvedElements].filter(asElementPredicate(expr)).filter(where)
  if (elements.length > 0) {
    this.excludeElement(...elements)
  }
}

function resolveNeighbours(this: ComputeCtx, expr: Expr.ElementExpression): Element[] {
  if (Expr.isElementRef(expr)) {
    return this.graph.ascendingSiblings(expr.element)
  }
  return this.root ? this.graph.ascendingSiblings(this.root) : this.graph.rootElements
}

function resolveElements(this: ComputeCtx, expr: Expr.ElementExpression): Element[] {
  if (Expr.isWildcard(expr)) {
    if (this.root) {
      return [...this.graph.children(this.root), this.graph.element(this.root)]
    } else {
      return this.graph.rootElements
    }
  }
  if (Expr.isElementKindExpr(expr)) {
    return this.graph.elements.filter(el => {
      if (expr.isEqual) {
        return el.kind === expr.elementKind
      }
      return el.kind !== expr.elementKind
    })
  }
  if (Expr.isElementTagExpr(expr)) {
    return this.graph.elements.filter(el => {
      const tags = el.tags
      if (expr.isEqual) {
        return !!tags && tags.includes(expr.elementTag)
      }
      return isNil(tags) || tags.length === 0 || !tags.includes(expr.elementTag)
    })
  }
  if (Expr.isExpandedElementExpr(expr)) {
    return [this.graph.element(expr.expanded)]
  }

  // Type guard
  if (!Expr.isElementRef(expr)) {
    return nonexhaustive(expr)
  }

  if (this.root === expr.element && expr.isDescedants !== true) {
    return [...this.graph.children(this.root), this.graph.element(this.root)]
  }

  if (expr.isDescedants) {
    return this.graph.childrenOrElement(expr.element)
  } else {
    return [this.graph.element(expr.element)]
  }
}

// --------------------------------
//  Incoming Expr

function edgesIncomingExpr(this: ComputeCtx, expr: Expr.ElementExpression) {
  if (Expr.isWildcard(expr)) {
    if (!this.root) {
      return []
    }
    const sources = this.graph.ascendingSiblings(this.root)
    const targets = [...this.graph.children(this.root), this.graph.element(this.root)]
    return this.graph.edgesBetween(sources, targets)
  }
  const targets = resolveElements.call(this, expr)
  if (targets.length === 0) {
    return []
  }
  let sources = [...this.resolvedElements]
  if (Expr.isElementRef(expr) || Expr.isExpandedElementExpr(expr)) {
    const exprElement = expr.element ?? expr.expanded
    const isDescedants = expr.isDescedants ?? false
    sources = sources.filter(el =>
      // allow elements, that are not nested or are direct children
      !isAncestor(exprElement, el.id) || (isDescedants && parentFqn(el.id) === exprElement)
    )
  }
  if (sources.length === 0) {
    sources = resolveNeighbours.call(this, expr)
  }
  return this.graph.edgesBetween(sources, targets)
}

const filterEdges = (edges: ReadonlyArray<ComputeCtx.Edge>, where?: RelationPredicateFn) => {
  if (!where) {
    return edges as ComputeCtx.Edge[]
  }
  return pipe(
    edges,
    map(e => ({ ...e, relations: e.relations.filter(where) })),
    remedaFilter(e => e.relations.length > 0)
  ) as ComputeCtx.Edge[]
}

const filterRelations = (edges: ComputeCtx.Edge[], where?: RelationPredicateFn) => {
  return pipe(
    edges,
    flatMap(e => e.relations),
    where ? remedaFilter(where) : Identity,
    unique()
  )
}

export function includeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr, where?: RelationPredicateFn) {
  const edges = filterEdges(edgesIncomingExpr.call(this, expr.incoming), where)
  if (edges.length === 0) {
    return
  }
  this.addEdges(edges).forEach(edge => {
    this.addImplicit(edge.target)
  })
}
export function excludeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr, where?: RelationPredicateFn) {
  let relations = filterRelations(edgesIncomingExpr.call(this, expr.incoming), where)
  this.excludeRelation(...relations)
}

// --------------------------------
//  Outgoing Expr

function edgesOutgoingExpr(this: ComputeCtx, expr: Expr.ElementExpression) {
  if (Expr.isWildcard(expr)) {
    if (!this.root) {
      return []
    }
    const targets = this.graph.ascendingSiblings(this.root)
    const sources = [...this.graph.children(this.root), this.graph.element(this.root)]
    return this.graph.edgesBetween(sources, targets)
  }
  const sources = resolveElements.call(this, expr)
  if (sources.length === 0) {
    return []
  }
  let targets = [...this.resolvedElements]
  if (Expr.isElementRef(expr) || Expr.isExpandedElementExpr(expr)) {
    const sourceElement = expr.element ?? expr.expanded
    const isDescedants = expr.isDescedants ?? false
    targets = targets.filter(el =>
      // allow elements, that are not nested or are direct children
      !isAncestor(sourceElement, el.id) || (isDescedants && parentFqn(el.id) === sourceElement)
    )
  }
  if (targets.length === 0) {
    targets = resolveNeighbours.call(this, expr)
  }
  return this.graph.edgesBetween(sources, targets)
}

export function includeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr, where?: RelationPredicateFn) {
  const edges = filterEdges(edgesOutgoingExpr.call(this, expr.outgoing), where)
  if (edges.length === 0) {
    return
  }
  this.addEdges(edges).forEach(edge => {
    this.addImplicit(edge.source)
  })
}
export function excludeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr, where?: RelationPredicateFn) {
  const relations = filterRelations(edgesOutgoingExpr.call(this, expr.outgoing), where)
  this.excludeRelation(...relations)
}

// --------------------------------
//  InOut Expr
type EdgePredicateResult = {
  implicits: Element[]
  edges: ComputeCtx.Edge[]
}

namespace EdgePredicateResult {
  export const Empty: EdgePredicateResult = {
    implicits: [],
    edges: []
  }
}
function edgesInOutExpr(this: ComputeCtx, { inout }: Expr.InOutExpr, where?: RelationPredicateFn): EdgePredicateResult {
  if (Expr.isWildcard(inout)) {
    if (!this.root) {
      return EdgePredicateResult.Empty
    }
    const neighbours = this.graph.ascendingSiblings(this.root)
    return {
      edges: filterEdges(this.graph.anyEdgesBetween(this.graph.element(this.root), neighbours), where),
      implicits: []
    }
  }
  const elements = resolveElements.call(this, inout)
  if (elements.length === 0) {
    return EdgePredicateResult.Empty
  }
  let currentElements = [...this.resolvedElements]

  if (Expr.isElementRef(inout) || Expr.isExpandedElementExpr(inout)) {
    const exprElement = inout.element ?? inout.expanded
    const isDescedants = inout.isDescedants ?? false
    currentElements = currentElements.filter(el =>
      // allow elements, that are not nested or are direct children
      !isAncestor(exprElement, el.id) || (isDescedants && parentFqn(el.id) === exprElement)
    )
  }
  if (currentElements.length === 0) {
    currentElements = resolveNeighbours.call(this, inout)
  }
  return elements.reduce<EdgePredicateResult>((acc, el) => {
    const edges = filterEdges(this.graph.anyEdgesBetween(el, currentElements), where)
    if (edges.length > 0) {
      acc.implicits.push(el)
      acc.edges.push(...edges)
    }
    return acc
  }, { implicits: [], edges: [] })
}

export function includeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr, where?: RelationPredicateFn) {
  const { implicits, edges } = edgesInOutExpr.call(this, expr, where)
  this.addEdges(edges)
  this.addImplicit(...implicits)
}
export function excludeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr, where?: RelationPredicateFn) {
  const { edges } = edgesInOutExpr.call(this, expr, where)
  this.excludeRelation(...edges.flatMap(e => e.relations))
}

/**
 * Expand element to its children and itself, if it is the root (and not ".*")
 * Example:
 *
 *   view of api {
 *     include some -> api
 *   }
 *
 * Transform to:
 *
 *   view of api {
 *     include  some -> api.*, some -> api
 *   }
 */
function resolveRelationExprElements(this: ComputeCtx, expr: Expr.ElementExpression) {
  if (Expr.isElementRef(expr) && this.root === expr.element && expr.isDescedants !== true) {
    return [...this.graph.children(expr.element), this.graph.element(expr.element)]
  }
  if (Expr.isExpandedElementExpr(expr) && this.root === expr.expanded) {
    return [...this.graph.children(expr.expanded), this.graph.element(expr.expanded)]
  }
  return resolveElements.call(this, expr)
}

export function includeRelationExpr(this: ComputeCtx, expr: Expr.RelationExpr, where?: RelationPredicateFn) {
  let sources, targets
  if (Expr.isWildcard(expr.source) && !Expr.isWildcard(expr.target)) {
    sources = resolveNeighbours.call(this, expr.target)
    targets = resolveRelationExprElements.call(this, expr.target)
  } else if (!Expr.isWildcard(expr.source) && Expr.isWildcard(expr.target)) {
    sources = resolveRelationExprElements.call(this, expr.source)
    targets = resolveNeighbours.call(this, expr.source)
  } else {
    sources = resolveRelationExprElements.call(this, expr.source)
    targets = resolveRelationExprElements.call(this, expr.target)
  }
  const edges = this.graph.edgesBetween(sources, targets)
  if (expr.isBidirectional === true) {
    edges.push(...this.graph.edgesBetween(targets, sources))
  }
  this.addEdges(filterEdges(edges, where)).forEach(edge => {
    this.activeGroup.addImplicit(edge.source, edge.target)
  })
}

export function excludeRelationExpr(this: ComputeCtx, expr: Expr.RelationExpr, where?: RelationPredicateFn) {
  const isSource = elementExprToPredicate(expr.source)
  const isTarget = elementExprToPredicate(expr.target)
  const satisfies = (edge: ComputeCtx.Edge) => {
    let result = isSource(edge.source) && isTarget(edge.target)
    if (!result && expr.isBidirectional) {
      result = isSource(edge.target) && isTarget(edge.source)
    }
    return result
  }
  const edges = this.edges.filter(satisfies)
  const relations = filterRelations(edges, where)
  this.excludeRelation(...relations)
}
