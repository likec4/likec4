import type { Element } from '@likec4/core'
import { Expr, parentFqn } from '@likec4/core'
import type { Predicate } from 'rambdax'
import { isNil, uniq } from 'remeda'
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
  const neighboursOf = this.root ?? (Expr.isElementRef(expr) ? expr.element : undefined)
  return neighboursOf
    ? [
        ...this.graph.siblings(neighboursOf),
        ...this.graph.ancestors(neighboursOf).flatMap(a => this.graph.siblings(a.id))
      ]
    : []
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
    const neighbours = resolveNeighbours.call(this, expr)
    if (neighbours.length === 0) {
      return []
    }
    const children = this.graph.childrenOrElement(this.root)
    return this.graph.edgesBetween(neighbours, children)
  }
  const elements = resolveElements.call(this, expr)
  if (elements.length === 0) {
    return []
  }
  const currentElements = [...this.elements, ...resolveNeighbours.call(this, expr)]
  if (currentElements.length === 0) {
    currentElements.push(...this.graph.rootElements)
  }
  return this.graph.edgesBetween(currentElements, elements)
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
    const neighbours = resolveNeighbours.call(this, expr)
    if (neighbours.length === 0) {
      return []
    }
    const from = this.graph.childrenOrElement(this.root)
    return this.graph.edgesBetween(from, neighbours)
  }
  const from = resolveElements.call(this, expr)
  if (from.length === 0) {
    return []
  }
  const currentElements = [...this.elements, ...resolveNeighbours.call(this, expr)]
  if (currentElements.length === 0) {
    currentElements.push(...this.graph.rootElements)
  }
  return this.graph.edgesBetween(from, currentElements)
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
  if (Expr.isWildcard(expr.inout) && !this.root) {
    return []
  }
  const elements = resolveElements.call(this, expr.inout)
  if (elements.length === 0) {
    return []
  }
  const currentElements = [...this.elements, ...resolveNeighbours.call(this, expr.inout)]
  if (currentElements.length === 0) {
    currentElements.push(...this.graph.rootElements)
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
  let edges
  if (Expr.isWildcard(expr.source) && !Expr.isWildcard(expr.target)) {
    edges = edgesIncomingExpr.call(this, expr.target)
  } else if (!Expr.isWildcard(expr.source) && Expr.isWildcard(expr.target)) {
    edges = edgesOutgoingExpr.call(this, expr.source)
  } else {
    const sources = resolveRelationExprElements.call(this, expr.source)
    const targets = resolveRelationExprElements.call(this, expr.target)
    edges = this.graph.edgesBetween(sources, targets)
  }
  this.addEdges(edges)
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
