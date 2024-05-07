import type { Element } from '@likec4/core'
import { Expr, invariant, nonexhaustive, parentFqn } from '@likec4/core'
import type { Predicate } from 'rambdax'
import { isNullish as isNil } from 'remeda'
import type { ComputeCtx } from './compute'

export function includeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr) {
  // Get the elements that are already in the Ctx before any mutations
  // Because we need to add edges between them and the new elements
  const currentElements = [...this.resolvedElements]

  const elements = expr.isDescedants === true
    ? this.graph.childrenOrElement(expr.element)
    : [this.graph.element(expr.element)]

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

export function excludeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr) {
  const elements = expr.isDescedants === true
    ? this.graph.children(expr.element)
    : [this.graph.element(expr.element)]
  this.excludeElement(...elements)
}

export function includeExpandedElementExpr(this: ComputeCtx, expr: Expr.ExpandedElementExpr) {
  const currentElements = [...this.resolvedElements]

  // Always add parent
  const parent = this.graph.element(expr.expanded)
  this.addElement(parent)
  const anyEdgesBetween = this.graph.anyEdgesBetween(parent, currentElements)

  this.addEdges(anyEdgesBetween)

  const expanded = [] as Element[]

  for (const el of this.graph.children(expr.expanded)) {
    this.addImplicit(el)
    if (anyEdgesBetween.length > 0) {
      const edges = this.graph.anyEdgesBetween(el, currentElements)
      if (edges.length > 0) {
        this.addEdges(edges)
        expanded.push(el)
      }
    }
  }
  if (expanded.length > 1) {
    this.addEdges(this.graph.edgesWithin(expanded))
  }
}

export function includeWildcardRef(this: ComputeCtx, _expr: Expr.WildcardExpr) {
  const root = this.root
  if (root) {
    const currentElements = [...this.resolvedElements]
    const _elRoot = this.graph.element(root)
    this.addElement(_elRoot)

    const children = this.graph.children(root)
    const hasChildren = children.length > 0
    if (hasChildren) {
      this.addElement(...children)
      this.addEdges(this.graph.edgesWithin(children))
    } else {
      children.push(_elRoot)
    }

    // All neighbours that may have relations with root or its children
    const neighbours = [
      ...currentElements,
      ...this.graph.siblings(root),
      ...this.graph.ancestors(root).flatMap(a => this.graph.siblings(a.id))
    ]

    for (const el of children) {
      this.addEdges(this.graph.anyEdgesBetween(el, neighbours))
    }

    // If root has no children
    if (!hasChildren) {
      // Any edges with siblings?
      const edgesWithSiblings = this.graph.anyEdgesBetween(_elRoot, this.graph.siblings(root))
      if (edgesWithSiblings.length === 0) {
        // If no edges with siblings, i.e. root is orphan
        // Lets add parent for better view
        const _parentId = parentFqn(root)
        const parent = _parentId && this.graph.element(_parentId)
        if (parent) {
          this.addElement(parent)
        }
      }
    }
  } else {
    // Take root elements
    this.addElement(...this.graph.rootElements)
    this.addEdges(this.graph.edgesWithin(this.graph.rootElements))
  }
}

export function excludeWildcardRef(this: ComputeCtx, _expr: Expr.WildcardExpr) {
  const root = this.root
  if (root) {
    this.excludeElement(
      this.graph.element(root),
      ...this.graph.children(root)
    )
    this.excludeRelation(
      ...this.graph.internal(root),
      ...this.graph.incoming(root),
      ...this.graph.outgoing(root)
    )
  } else {
    this.reset()
  }
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
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
) {
  const elements = this.graph.elements.filter(asElementPredicate(expr))
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
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
) {
  const elements = this.graph.elements.filter(asElementPredicate(expr))
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
  const currentElements = [...this.resolvedElements]
  if (currentElements.length === 0) {
    currentElements.push(...resolveNeighbours.call(this, expr))
  }
  return this.graph.edgesBetween(currentElements, targets)
}

export function includeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr) {
  const edges = edgesIncomingExpr.call(this, expr.incoming)
  this.addEdges(edges)
  this.addImplicit(...edges.map(e => e.target))
}
export function excludeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr) {
  const edges = edgesIncomingExpr.call(this, expr.incoming)
  this.excludeRelation(...edges.flatMap(e => e.relations))
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
  const targets = [...this.resolvedElements]
  if (targets.length === 0) {
    targets.push(...resolveNeighbours.call(this, expr))
  }
  return this.graph.edgesBetween(sources, targets)
}

export function includeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr) {
  const edges = edgesOutgoingExpr.call(this, expr.outgoing)
  this.addEdges(edges)
  this.addImplicit(...edges.map(e => e.source))
}
export function excludeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr) {
  const edges = edgesOutgoingExpr.call(this, expr.outgoing)
  this.excludeRelation(...edges.flatMap(e => e.relations))
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
function edgesInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr): EdgePredicateResult {
  if (Expr.isWildcard(expr.inout)) {
    if (!this.root) {
      return EdgePredicateResult.Empty
    }
    const neighbours = this.graph.ascendingSiblings(this.root)
    return {
      edges: this.graph.anyEdgesBetween(this.graph.element(this.root), neighbours),
      implicits: []
    }
  }
  const elements = resolveElements.call(this, expr.inout)
  if (elements.length === 0) {
    return EdgePredicateResult.Empty
  }
  const currentElements = [...this.resolvedElements]
  if (currentElements.length === 0) {
    currentElements.push(...resolveNeighbours.call(this, expr.inout))
  }
  return elements.reduce<EdgePredicateResult>((acc, el) => {
    const edges = this.graph.anyEdgesBetween(el, currentElements)
    if (edges.length > 0) {
      acc.implicits.push(el)
      acc.edges.push(...edges)
    }
    return acc
  }, { implicits: [], edges: [] })
}

export function includeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr) {
  const { implicits, edges } = edgesInOutExpr.call(this, expr)
  this.addEdges(edges)
  this.addImplicit(...implicits)
}
export function excludeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr) {
  const { edges } = edgesInOutExpr.call(this, expr)
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
  return resolveElements.call(this, expr)
}

export function includeRelationExpr(this: ComputeCtx, expr: Expr.RelationExpr) {
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
  this.addEdges(edges)
}

export function excludeRelationExpr(this: ComputeCtx, expr: Expr.RelationExpr) {
  const sources = resolveRelationExprElements.call(this, expr.source)
  const targets = resolveRelationExprElements.call(this, expr.target)
  const edges = this.graph.edgesBetween(sources, targets)
  if (expr.isBidirectional === true) {
    edges.push(...this.graph.edgesBetween(targets, sources))
  }

  const relations = new Set(edges.flatMap(e => e.relations))
  this.excludeRelation(...relations)
}

export function includeCustomElement(this: ComputeCtx, expr: Expr.CustomElementExpr) {
  // Get the elements that are already in the Ctx before any mutations
  // Because we need to add edges between them and the new elements
  const currentElements = [...this.resolvedElements]

  const el = this.graph.element(expr.custom.element)

  this.addElement(el)

  if (currentElements.length > 0) {
    this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
  }
}
