import { anyPass, both, either, isNil, uniq, type Predicate } from 'rambdax'
import type { Element, Relation } from '../types'
import { Expr } from '../types'
import { Relations, commonAncestor, isAncestor, isSameHierarchy } from '../utils'
import { ComputeCtx } from './compute-ctx'

const { isAnyInOut, isBetween, isIncoming, isInside, isOutgoing, isAnyBetween } = Relations

export const includeElementRef = (ctx: ComputeCtx, expr: Expr.ElementRefExpr) => {
  const elements = expr.isDescedants
    ? ctx.index.children(expr.element)
    : [ctx.index.find(expr.element)]
  const filters = [] as Predicate<Relation>[]
  if (expr.isDescedants) {
    elements.forEach(child => {
      filters.push(both(isInside(expr.element), isAnyInOut(child.id)))
    })
  }

  const ctxElements = uniq([...ctx.elements, ...ctx.implicits])
  const excludeImplicits = [] as Element[]

  for (const el of elements) {
    if (ctx.root && ctx.root !== el.id && !isAncestor(el.id, ctx.root)) {
      excludeImplicits.push(...[...ctx.implicits].filter(impl => isAncestor(el.id, impl.id)))
    }
    for (const ctxEl of ctxElements) {
      if (!isSameHierarchy(el, ctxEl)) {
        filters.push(isAnyBetween(el.id, ctxEl.id))
      }
    }
  }

  const relations = filters.length ? ctx.index.filterRelations(anyPass(filters)) : []
  if (excludeImplicits.length == 0) {
    return ctx.include({ elements, relations })
  }

  return ctx.include({ elements, relations }).exclude({ implicits: excludeImplicits })
}
export const excludeElementRef = (ctx: ComputeCtx, expr: Expr.ElementRefExpr) => {
  const elements = expr.isDescedants
    ? ctx.index.children(expr.element)
    : [ctx.index.find(expr.element)]
  const elementsIds = elements.map(e => e.id)
  const relations = [...ctx.relations].filter(
    r => elementsIds.includes(r.source) || elementsIds.includes(r.target)
  )
  return ctx.exclude({ elements, relations })
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
export const includeElementKindOrTag = (
  ctx: ComputeCtx,
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
) => {
  const elements = ctx.index.elements.filter(asElementPredicate(expr))
  return elements.reduce(
    (accCtx, el) =>
      includeElementRef(accCtx, {
        element: el.id,
        isDescedants: false
      }),
    ctx
  )
}
export const excludeElementKindOrTag = (
  ctx: ComputeCtx,
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
) => {
  const predicate = asElementPredicate(expr)
  const elements = [...ctx.elements].filter(predicate)
  const implicits = [...ctx.implicits].filter(predicate)
  return ctx.exclude({ elements, implicits })
}
export const includeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
  const { root } = ctx
  if (root) {
    const elements = [ctx.index.find(root), ...ctx.index.children(root)]
    // All neighbors that may have relations with root or its children
    const allImplicits = [
      ...ctx.index.siblings(root),
      ...ctx.index.ancestors(root).flatMap(a => [...ctx.index.siblings(a.id)])
    ]
    const inOut = ctx.index.filterRelations(isAnyInOut(root))

    // Neighbors that have relations with root or its children
    const implicits = [] as Element[]

    for (const implicit of allImplicits) {
      if (inOut.some(isAnyInOut(implicit.id))) {
        implicits.push(implicit)
      }
    }

    return ctx.include({
      elements,
      relations: [...ctx.index.filterRelations(isInside(root)), ...inOut],
      implicits: implicits
    })
  } else {
    // Take root elements
    const elements = ctx.index.rootElements()
    if (elements.length <= 1) {
      return new ComputeCtx(ctx.index, ctx.root, new Set(elements))
    }

    // Only relations without common ancenstors, i.e. between hierarchies
    const relations = ctx.index.filterRelations(rel =>
      isNil(commonAncestor(rel.source, rel.target))
    )

    return ctx.include({
      elements,
      relations
    })
  }
}
export const excludeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
  const { root } = ctx
  if (root) {
    const relations = [...ctx.relations].filter(either(isInside(root), isAnyInOut(root)))
    return ctx.exclude({
      elements: [...ctx.elements].filter(e => e.id === root || isAncestor(root, e.id)),
      relations,
      implicits: [...ctx.implicits].filter(e => relations.some(isAnyInOut(e.id)))
    })
  } else {
    return new ComputeCtx(ctx.index, ctx.root)
  }
}
const resolveElements = (ctx: ComputeCtx, expr: Expr.ElementExpression): Element[] => {
  if (Expr.isWildcard(expr)) {
    if (ctx.root) {
      return [ctx.index.find(ctx.root)]
    } else {
      return ctx.index.rootElements()
    }
  }
  if (Expr.isElementKindExpr(expr)) {
    return ctx.index.elements.filter(el => {
      if (expr.isEqual) {
        return el.kind === expr.elementKind
      }
      return el.kind !== expr.elementKind
    })
  }
  if (Expr.isElementTagExpr(expr)) {
    return ctx.index.elements.filter(el => {
      const tags = el.tags
      if (expr.isEqual) {
        return !!tags && tags.includes(expr.elementTag)
      }
      return isNil(tags) || tags.length === 0 || !tags.includes(expr.elementTag)
    })
  }

  if (expr.isDescedants) {
    return ctx.index.children(expr.element)
  } else {
    return [ctx.index.find(expr.element)]
  }
}
export const includeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.incoming) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.incoming)
  if (elements.length === 0) {
    return ctx
  }
  // '-> element.*' should include only "outside" relations.
  // From the outside to the element descendants,
  let allrelations = ctx.index.relations
  if (Expr.isElementRef(expr.incoming)) {
    allrelations = allrelations.filter(isIncoming(expr.incoming.element))
  }

  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const el of elements) {
    const elRelations = allrelations.filter(isIncoming(el.id))
    if (elRelations.length > 0) {
      relations.push(...elRelations)
      implicits.push(el)
    }
  }

  return ctx.include({
    relations,
    implicits
  })
}
export const excludeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.incoming) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.incoming)
  if (elements.length === 0) {
    return ctx
  }
  const isIncomings = anyPass(elements.map(el => isIncoming(el.id)))

  const excluded = [...ctx.relations].filter(isIncomings)
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}
export const includeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.outgoing) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.outgoing)
  if (elements.length === 0) {
    return ctx
  }
  // 'element.* -> ' should include only "outside" relations.
  // From element descendants to outside of 'element.*'
  let allrelations = ctx.index.relations
  if (Expr.isElementRef(expr.outgoing)) {
    allrelations = allrelations.filter(isOutgoing(expr.outgoing.element))
  }
  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const el of elements) {
    const elRelations = allrelations.filter(isOutgoing(el.id))
    if (elRelations.length > 0) {
      relations.push(...elRelations)
      implicits.push(el)
    }
  }

  return ctx.include({
    relations,
    implicits
  })
}
export const excludeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.outgoing) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.outgoing)
  if (elements.length === 0) {
    return ctx
  }
  const isOutgoings = anyPass(elements.map(el => isOutgoing(el.id)))

  const excluded = [...ctx.relations].filter(isOutgoings)
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}
export const includeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.inout) && !ctx.root) {
    return ctx
  }
  const targets = resolveElements(ctx, expr.inout)
  if (targets.length === 0) {
    return ctx
  }
  // '-> element.* -> ' should include only "outside" relations.
  let allrelations = ctx.index.relations
  if (Expr.isElementRef(expr.inout)) {
    allrelations = allrelations.filter(isAnyInOut(expr.inout.element))
  }

  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const target of targets) {
    const foundRelations = allrelations.filter(isAnyInOut(target.id))
    if (foundRelations.length > 0) {
      relations.push(...foundRelations)
      implicits.push(target)
    }
  }

  return ctx.include({
    relations,
    implicits
  })
}
export const excludeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
  if (Expr.isWildcard(expr.inout) && !ctx.root) {
    return ctx
  }
  const targets = resolveElements(ctx, expr.inout)
  if (targets.length === 0) {
    return ctx
  }
  const excluded = [...ctx.relations].filter(anyPass(targets.map(t => isAnyInOut(t.id))))
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}
export const includeRelationExpr = (ctx: ComputeCtx, expr: Expr.RelationExpr): ComputeCtx => {
  const sources = resolveElements(ctx, expr.source)
  const targets = resolveElements(ctx, expr.target)
  if (sources.length === 0 || targets.length === 0) {
    return ctx
  }

  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const source of sources) {
    for (const target of targets) {
      if (isSameHierarchy(source, target)) {
        continue
      }
      const foundRelations = ctx.index.filterRelations(isBetween(source.id, target.id))
      if (foundRelations.length > 0) {
        relations.push(...foundRelations)
        implicits.push(source, target)
      }
    }
  }

  return ctx.include({
    relations,
    implicits
  })
}
export const excludeRelationExpr = (ctx: ComputeCtx, expr: Expr.RelationExpr): ComputeCtx => {
  const sources = resolveElements(ctx, expr.source)
  const targets = resolveElements(ctx, expr.target)
  const filters = [] as Predicate<Relation>[]

  for (const source of sources) {
    for (const target of targets) {
      if (isSameHierarchy(source, target)) {
        continue
      }
      filters.push(isBetween(source.id, target.id))
    }
  }
  if (filters.length == 0) {
    return ctx
  }
  const excluded = [...ctx.relations].filter(anyPass(filters))
  if (excluded.length == 0) {
    return ctx
  }

  return ctx.exclude({
    relations: excluded
  })
}
