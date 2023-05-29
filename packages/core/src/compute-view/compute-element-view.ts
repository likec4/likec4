import { anyPass, filter, head, type Predicate } from 'rambdax'
import type { ModelIndex } from '../model-index'
import { type Fqn, type Element, type ElementView, type Relation, DefaultThemeColor, DefaultElementShape, type ComputedNode, type ComputedView } from '../types'
import type * as Expr from '../types/expression'
import * as Expression from '../types/expression'
import { isViewRuleAutoLayout, isViewRuleExpression, isViewRuleStyle, type ViewID, type ViewRuleStyle } from '../types/view'
import { compareByFqnHierarchically, failExpectedNever, ignoreNeverInRuntime, isAncestor, isSameHierarchy, notDescendantOf, parentFqn, Relations } from '../utils'
import { hasRelation, isAnyInOut, isBetween, isIncoming, isInside, isOutgoing } from '../utils/relations'
import { EdgeBuilder } from './EdgeBuilder'
import { sortNodes } from './utils/sortNodes'
import { ComputeCtx } from './compute-ctx'
import { anyPossibleRelations } from './utils/anyPossibleRelations'

function transformToNodes(
  elementsIterator: Iterable<Element>,
  index: ModelIndex,
  currentViewid?: ViewID
) {
  return Array.from(elementsIterator)
    .sort(compareByFqnHierarchically)
    .reduce((map, { id, title, color, shape, description }) => {
      let parent = parentFqn(id)
      while (parent) {
        if (map.has(parent)) {
          break
        }
        parent = parentFqn(parent)
      }
      const navigateTo = head(index.defaultViewOf(id).filter(v => v !== currentViewid))
      map.set(
        id,
        Object.assign(
          {
            id,
            parent,
            title,
            color: color ?? DefaultThemeColor,
            shape: shape ?? DefaultElementShape,
            children: []
          },
          description ? { description } : {},
          navigateTo ? { navigateTo } : {}
        )
      )
      if (parent) {
        map.get(parent)?.children.push(id)
      }
      return map
    }, new Map<Fqn, ComputedNode>())
}

function applyViewRuleStyles(rules: ViewRuleStyle[], nodes: ComputedNode[]) {
  for (const rule of rules) {
    const predicates = [] as Predicate<ComputedNode>[]
    if (!rule.style.color && !rule.style.shape) {
      // skip empty
      continue
    }
    for (const target of rule.targets) {
      if (Expression.isWildcard(target)) {
        predicates.push(() => true)
        break
      }
      if (Expression.isElementRef(target)) {
        const { element, isDescedants } = target
        predicates.push(
          isDescedants ? n => n.id.startsWith(element + '.') : n => (n.id as string) === element
        )
        continue
      }
      failExpectedNever(target)
    }
    filter(anyPass(predicates), nodes).forEach(n => {
      n.shape = rule.style.shape ?? n.shape
      n.color = rule.style.color ?? n.color
    })
  }

  return nodes
}

const includeElementRef = (ctx: ComputeCtx, expr: Expr.ElementRefExpr) => {
  const elements = expr.isDescedants
    ? ctx.index.children(expr.element)
    : [ctx.index.find(expr.element)]
  const filters = [] as Predicate<Relation>[]
  if (expr.isDescedants) {
    filters.push(Relations.isInside(expr.element))
  }
  let excludeImplicits = [] as Element[]
  for (const el of elements) {
    if (ctx.root && ctx.root !== el.id && !isAncestor(el.id, ctx.root)) {
      excludeImplicits = excludeImplicits.concat(
        [...ctx.implicits].filter(impl => isAncestor(el.id, impl.id))
      )
    }
    for (const current of ctx.elements) {
      if (!isSameHierarchy(el, current)) {
        filters.push(Relations.isAnyBetween(el.id, current.id))
      }
    }
  }
  const relations = ctx.index.filterRelations(anyPass(filters))

  if (excludeImplicits.length == 0) {
    return ctx.include({ elements, relations })
  }

  return ctx
    .include({ elements, relations })
    .exclude({ implicits: excludeImplicits })
}

const excludeElementRef = (ctx: ComputeCtx, expr: Expr.ElementRefExpr) => {
  const elements = expr.isDescedants
    ? ctx.index.children(expr.element)
    : [ctx.index.find(expr.element)]
  const elementsIds = elements.map(e => e.id)
  const relations = [...ctx.relations].filter(
    r => elementsIds.includes(r.source) || elementsIds.includes(r.target)
  )
  return ctx.exclude({ elements, relations })
}

const includeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
  const { root } = ctx
  if (root) {
    return ctx.include({
      elements: [ctx.index.find(root), ...ctx.index.children(root)],
      relations: ctx.index.filterRelations(
        anyPass([isInside(root), isIncoming(root), isOutgoing(root)])
      ),
      implicits: [
        ...ctx.index.siblings(root),
        ...ctx.index.ancestors(root).flatMap(a => [...ctx.index.siblings(a.id)])
      ]
    })
  } else {
    return new ComputeCtx(
      ctx.index,
      ctx.root,
      new Set(ctx.index.rootElements()),
      new Set([...ctx.index.relations])
    )
  }
}

const excludeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
  const { root } = ctx
  if (root) {
    const relations = [...ctx.relations].filter(
      anyPass([isInside(root), isIncoming(root), isOutgoing(root)])
    )
    return ctx.exclude({
      elements: [...ctx.elements].filter(e => isAncestor(root, e.id)),
      relations,
      implicits: [...ctx.implicits].filter(anyPass(relations.map(r => hasRelation(r))))
    })
  } else {
    return new ComputeCtx(ctx.index, ctx.root)
  }
}

const resolveElements = (ctx: ComputeCtx, expr: Expr.ElementExpression): Element[] => {
  if (Expression.isWildcard(expr)) {
    if (ctx.root) {
      return [ctx.index.find(ctx.root)]
    } else {
      return ctx.index.rootElements()
    }
  } else {
    if (expr.isDescedants) {
      return ctx.index.children(expr.element)
    } else {
      return [ctx.index.find(expr.element)]
    }
  }
}

const includeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.incoming) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.incoming)
  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const el of elements) {
    const elRelations = ctx.index.filterRelations(isIncoming(el.id))
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

const excludeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.incoming) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.incoming)
  const isIncomings = anyPass(elements.map(el => isIncoming(el.id)))

  const excluded = [...ctx.relations].filter(isIncomings)
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}

const includeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.outgoing) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.outgoing)
  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const el of elements) {
    const elRelations = ctx.index.filterRelations(isOutgoing(el.id))
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

const excludeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.outgoing) && !ctx.root) {
    return ctx
  }
  const elements = resolveElements(ctx, expr.outgoing)
  const isOutgoings = anyPass(elements.map(el => isOutgoing(el.id)))

  const excluded = [...ctx.relations].filter(isOutgoings)
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}

const includeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.inout) && !ctx.root) {
    return ctx
  }
  const targets = resolveElements(ctx, expr.inout)

  const implicits = [] as Element[]
  const relations = [] as Relation[]

  for (const target of targets) {
    const foundRelations = ctx.index.filterRelations(isAnyInOut(target.id))
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

const excludeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
  if (Expression.isWildcard(expr.inout) && !ctx.root) {
    return ctx
  }
  const targets = resolveElements(ctx, expr.inout)
  const excluded = [...ctx.relations].filter(
    anyPass(targets.map(t => isAnyInOut(t.id)))
  )
  if (excluded.length > 0) {
    return ctx.exclude({
      relations: excluded
    })
  }

  return ctx
}

const includeRelationExpr = (ctx: ComputeCtx, expr: Expr.RelationExpr): ComputeCtx => {
  const sources = resolveElements(ctx, expr.source)
  const targets = resolveElements(ctx, expr.target)

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

const excludeRelationExpr = (ctx: ComputeCtx, expr: Expr.RelationExpr): ComputeCtx => {
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
      if (Expression.isElementRef(expr)) {
        ctx = isInclude ? includeElementRef(ctx, expr) : excludeElementRef(ctx, expr)
        continue
      }
      if (Expression.isWildcard(expr)) {
        ctx = isInclude ? includeWildcardRef(ctx, expr) : excludeWildcardRef(ctx, expr)
        continue
      }
      if (Expression.isIncoming(expr)) {
        ctx = isInclude ? includeIncomingExpr(ctx, expr) : excludeIncomingExpr(ctx, expr)
        continue
      }
      if (Expression.isOutgoing(expr)) {
        ctx = isInclude ? includeOutgoingExpr(ctx, expr) : excludeOutgoingExpr(ctx, expr)
        continue
      }
      if (Expression.isInOut(expr)) {
        ctx = isInclude ? includeInOutExpr(ctx, expr) : excludeInOutExpr(ctx, expr)
        continue
      }
      if (Expression.isRelation(expr)) {
        ctx = isInclude ? includeRelationExpr(ctx, expr) : excludeRelationExpr(ctx, expr)
        continue
      }
      ignoreNeverInRuntime(expr)
    }
  }
  const elements = new Set([...ctx.elements])

  const edgeBuilder = new EdgeBuilder()
  const resolvedRelations = [...ctx.relations]

  for (const [source, target] of anyPossibleRelations([...elements, ...ctx.implicits])) {
    if (!elements.has(source) && !elements.has(target)) {
      continue
    }
    const findPredicate = Relations.isBetween(source.id, target.id)
    let idx = resolvedRelations.findIndex(findPredicate)
    while (idx >= 0) {
      const [rel] = resolvedRelations.splice(idx, 1)
      if (rel) {
        elements.add(source)
        elements.add(target)
        edgeBuilder.add(source.id, target.id, rel)
      }
      idx = resolvedRelations.findIndex(findPredicate)
    }
  }

  const nodesreg = transformToNodes(elements, index, view.id)

  const edges = edgeBuilder.build().map(edge => {
    while (edge.parent) {
      if (nodesreg.has(edge.parent)) {
        break
      }
      edge.parent = parentFqn(edge.parent)
    }
    return edge
  })

  const nodes = applyViewRuleStyles(view.rules.filter(isViewRuleStyle), sortNodes(nodesreg, edges))

  const autoLayoutRule = view.rules.find(isViewRuleAutoLayout)

  return {
    ...view,
    autoLayout: autoLayoutRule?.autoLayout ?? 'TB',
    nodes,
    edges
  }
}
