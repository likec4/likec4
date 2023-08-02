import { anyPass, filter, isNil, uniq, type Predicate, both, either } from 'rambdax'
import { allPass, find, isDefined } from 'remeda'
import { invariant, nonexhaustive } from '../errors'
import type { ModelIndex } from '../model-index'
import {
  DefaultElementShape,
  DefaultThemeColor,
  type ComputeResult,
  type ComputedNode,
  type Element,
  type ElementView,
  type Fqn,
  type Relation
} from '../types'
import * as Expr from '../types/expression'
import {
  isViewRuleAutoLayout,
  isViewRuleExpression,
  isViewRuleStyle,
  type ViewRuleStyle
} from '../types/view'
import {
  Relations,
  commonAncestor,
  compareByFqnHierarchically,
  failUnexpected,
  ignoreNeverInRuntime,
  isAncestor,
  isSameHierarchy,
  parentFqn
} from '../utils'
import {
  compareRelations,
  isAnyInOut,
  isBetween,
  isIncoming,
  isInside,
  isOutgoing
} from '../utils/relations'
import { EdgeBuilder } from './EdgeBuilder'
import { ComputeCtx } from './compute-ctx'
import { sortNodes } from './utils/sortNodes'

function transformToNodes(elementsIterator: Iterable<Element>) {
  return Array.from(elementsIterator)
    .sort(compareByFqnHierarchically)
    .reduce((map, { id, color, shape, ...el }) => {
      let parent = parentFqn(id)
      while (parent) {
        if (map.has(parent)) {
          break
        }
        parent = parentFqn(parent)
      }
      if (parent) {
        const parentNd = map.get(parent)
        invariant(parentNd, `parent node ${parent} not found`)
        parentNd.children.push(id)
      }
      const node: ComputedNode = {
        ...el,
        id,
        parent,
        color: color ?? DefaultThemeColor,
        shape: shape ?? DefaultElementShape,
        children: []
      }
      map.set(id, node)
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
      if (Expr.isWildcard(target)) {
        predicates.push(() => true)
        break
      }
      if (Expr.isElementKindExpr(target)) {
        predicates.push(
          target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind
        )
        continue
      }
      if (Expr.isElementTagExpr(target)) {
        predicates.push(
          target.isEqual
            ? ({ tags }) => !!tags && tags.includes(target.elementTag)
            : ({ tags }) => isNil(tags) || !tags.includes(target.elementTag)
        )
        continue
      }
      if (Expr.isElementRef(target)) {
        const { element, isDescedants } = target
        predicates.push(
          isDescedants ? n => n.id.startsWith(element + '.') : n => (n.id as string) === element
        )
        continue
      }
      failUnexpected(target)
    }
    filter(anyPass(predicates), nodes).forEach(n => {
      n.shape = rule.style.shape ?? n.shape
      n.color = rule.style.color ?? n.color
      if (isDefined.strict(rule.style.icon)) {
        n.icon = rule.style.icon
      }
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
    elements.forEach(child => {
      filters.push(both(Relations.isInside(expr.element), Relations.isAnyInOut(child.id)))
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
        filters.push(Relations.isAnyBetween(el.id, ctxEl.id))
      }
    }
  }

  const relations = filters.length ? ctx.index.filterRelations(anyPass(filters)) : []
  if (excludeImplicits.length == 0) {
    return ctx.include({ elements, relations })
  }

  return ctx.include({ elements, relations }).exclude({ implicits: excludeImplicits })
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

const includeElementKindOrTag = (
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

const excludeElementKindOrTag = (
  ctx: ComputeCtx,
  expr: Expr.ElementKindExpr | Expr.ElementTagExpr
) => {
  const predicate = asElementPredicate(expr)
  const elements = [...ctx.elements].filter(predicate)
  const implicits = [...ctx.implicits].filter(predicate)
  return ctx.exclude({ elements, implicits })
}

const includeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
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

const excludeWildcardRef = (ctx: ComputeCtx, _expr: Expr.WildcardExpr) => {
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

const includeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
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

const excludeIncomingExpr = (ctx: ComputeCtx, expr: Expr.IncomingExpr): ComputeCtx => {
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

const includeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
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

const excludeOutgoingExpr = (ctx: ComputeCtx, expr: Expr.OutgoingExpr): ComputeCtx => {
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

const includeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
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

const excludeInOutExpr = (ctx: ComputeCtx, expr: Expr.InOutExpr): ComputeCtx => {
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

const includeRelationExpr = (ctx: ComputeCtx, expr: Expr.RelationExpr): ComputeCtx => {
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

export function computeElementView<V extends ElementView>(
  view: V,
  index: ModelIndex
): ComputeResult<V> {
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
  const allElements = [...ctx.elements, ...ctx.implicits].sort(compareByFqnHierarchically).reverse()

  // Filtered "allElements", only with relations
  const elementsWithRelations = new Set<Element>()

  const edgeBuilder = new EdgeBuilder()

  const anscestorOf = (id: Fqn) => (e: Element) => e.id === id || isAncestor(e.id, id)

  // Step 1: Add explicit relations
  const sortedRelations = [...ctx.relations].sort(compareRelations)
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

  const elements = new Set([...elementsWithRelations, ...ctx.elements])

  // Step 2: Add implicit relations
  // if (relationsWithImplicits.length > 0) {
  //   elmnts = [...ctx.elements, ...ctx.implicits].sort(compareByFqnHierarchically).reverse()
  //   for (const rel of relationsWithImplicits) {
  //     const source = find(elmnts, anscestorOf(rel.source))
  //     if (!source) {
  //       continue
  //     }
  //     const target = find(elmnts, anscestorOf(rel.target))
  //     if (!target || isSameHierarchy(source, target)) {
  //       continue
  //     }
  //     elements.add(source)
  //     elements.add(target)
  //     edgeBuilder.add(source.id, target.id, rel)
  //   }
  // }

  // for (const [source, target] of anyPossibleRelations([...elements, ...ctx.implicits])) {
  //   if (!elements.has(source) && !elements.has(target)) {
  //     continue
  //   }
  //   const findPredicate = Relations.isBetween(source.id, target.id)
  //   let idx = resolvedRelations.findIndex(findPredicate)
  //   while (idx >= 0) {
  //     const [rel] = resolvedRelations.splice(idx, 1)
  //     if (rel) {
  //       elements.add(source)
  //       elements.add(target)
  //       edgeBuilder.add(source.id, target.id, rel)
  //     }
  //     idx = resolvedRelations.findIndex(findPredicate)
  //   }
  // }

  const nodesreg = transformToNodes(elements)

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
