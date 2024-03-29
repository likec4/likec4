import type { Element } from '@likec4/core'
import { Expr, isAncestor, isSameHierarchy, parentFqn } from '@likec4/core'
import type { Predicate } from 'rambdax'
import { isNil } from 'remeda'
import type { ComputeCtx } from './compute'

export function includeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr) {
  // Get the elements that are already in the Ctx before any mutations
  // Because we need to add edges between them and the new elements
  const currentElements = [...this.elements]

  const elements =
    expr.isDescedants === true
      ? this.graph.childrenOrElement(expr.element)
      : [this.graph.element(expr.element)]

  this.addElement(...elements)

  if (expr.isDescedants === true && elements.length > 0) {
    this.addEdges(this.graph.edgesWithin(elements))
  }

  if (currentElements.length > 0 && elements.length > 0) {
    for (const el of elements) {
      this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
    }
  }
}

export function excludeElementRef(this: ComputeCtx, expr: Expr.ElementRefExpr) {
  const elements =
    expr.isDescedants === true
      ? this.graph.children(expr.element)
      : [this.graph.element(expr.element)]

  for (const el of elements) {
    this.excludeElement(el)
  }
}

export function includeWildcardRef(this: ComputeCtx, _expr: Expr.WildcardExpr) {
  const currentElements = [...this.elements]
  const root = this.root
  if (root) {
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
    this.excludeElement(this.graph.element(root))
    this.excludeElement(...this.graph.children(root))
    this.excludeRelation(
      ...[...this.graph.internal(root), ...this.graph.incoming(root), ...this.graph.outgoing(root)]
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
  const currentElements = [...this.elements]
  const elements = this.graph.elements.filter(asElementPredicate(expr))
  if (elements.length > 0) {
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
  const currentElements = [...this.elements]
  if (currentElements.length === 0) {
    currentElements.push(...resolveNeighbours.call(this, expr))
  }
  return this.graph.edgesBetween(currentElements, targets)
}

export function includeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr) {
  const edges = edgesIncomingExpr.call(this, expr.incoming)
  if (edges.length > 0) {
    this.addEdges(edges)
  }
}
export function excludeIncomingExpr(this: ComputeCtx, expr: Expr.IncomingExpr) {
  const edges = edgesIncomingExpr.call(this, expr.incoming)
  if (edges.length > 0) {
    this.excludeRelation(...edges.flatMap(e => e.relations))
  }
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
  const targets = [...this.elements]
  if (targets.length === 0) {
    targets.push(...resolveNeighbours.call(this, expr))
  }
  return this.graph.edgesBetween(sources, targets)
}

export function includeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr) {
  const edges = edgesOutgoingExpr.call(this, expr.outgoing)
  if (edges.length > 0) {
    this.addEdges(edges)
  }
}
export function excludeOutgoingExpr(this: ComputeCtx, expr: Expr.OutgoingExpr) {
  const edges = edgesOutgoingExpr.call(this, expr.outgoing)
  if (edges.length > 0) {
    this.excludeRelation(...edges.flatMap(e => e.relations))
  }
}

// --------------------------------
//  InOut Expr

function edgesInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr) {
  if (Expr.isWildcard(expr.inout)) {
    if (!this.root) {
      return []
    }
    const neighbours = this.graph.ascendingSiblings(this.root)
    return this.graph.anyEdgesBetween(this.graph.element(this.root), neighbours)
  }
  const elements = resolveElements.call(this, expr.inout)
  if (elements.length === 0) {
    return []
  }
  const currentElements = [...this.elements]
  if (currentElements.length === 0) {
    currentElements.push(...resolveNeighbours.call(this, expr.inout))
  }
  return elements.flatMap(el => this.graph.anyEdgesBetween(el, currentElements))
}

export function includeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr) {
  const edges = edgesInOutExpr.call(this, expr)
  if (edges.length > 0) {
    this.addEdges(edges)
  }
}
export function excludeInOutExpr(this: ComputeCtx, expr: Expr.InOutExpr) {
  const edges = edgesInOutExpr.call(this, expr)
  if (edges.length > 0) {
    this.excludeRelation(...edges.flatMap(e => e.relations))
  }
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
 *
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
  this.addEdges(this.graph.edgesBetween(sources, targets))
}

export function excludeRelationExpr(this: ComputeCtx, expr: Expr.RelationExpr) {
  const sources = resolveRelationExprElements.call(this, expr.source)
  const targets = resolveRelationExprElements.call(this, expr.target)
  const relations = this.graph.edgesBetween(sources, targets).flatMap(e => e.relations)
  this.excludeRelation(...relations)
}

export function includeCustomElement(this: ComputeCtx, expr: Expr.CustomElementExpr) {
  // Get the elements that are already in the Ctx before any mutations
  // Because we need to add edges between them and the new elements
  const currentElements = [...this.elements]

  const el = this.graph.element(expr.custom.element)

  this.addElement(el)

  if (currentElements.length > 0) {
    this.addEdges(this.graph.anyEdgesBetween(el, currentElements))
  }
}
