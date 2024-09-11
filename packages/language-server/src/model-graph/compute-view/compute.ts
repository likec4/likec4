import type {
  Color,
  ComputedEdge,
  ComputedElementView,
  EdgeId,
  Element,
  ElementPredicateExpression,
  ElementView,
  NonEmptyArray,
  Relation,
  RelationPredicateExpression,
  RelationshipArrowType,
  RelationshipKind,
  RelationshipLineType,
  Tag,
  ViewID,
  ViewRulePredicate
} from '@likec4/core'
import {
  ancestorsFqn,
  commonAncestor,
  compareRelations,
  Expr,
  invariant,
  isAncestor,
  isScopedElementView,
  isViewRuleAutoLayout,
  isViewRulePredicate,
  nonexhaustive,
  parentFqn,
  whereOperatorAsPredicate
} from '@likec4/core'
import { filter, flatMap, hasAtLeast, isNonNull, isTruthy, map, omit, only, pipe, reduce, sort, unique } from 'remeda'
import { calcViewLayoutHash } from '../../view-utils/view-hash'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyCustomRelationProperties } from '../utils/applyCustomRelationProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputeNodes } from '../utils/buildComputeNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { sortNodes } from '../utils/sortNodes'
import {
  type ElementPredicateFn,
  excludeElementKindOrTag,
  excludeElementRef,
  excludeExpandedElementExpr,
  excludeIncomingExpr,
  excludeInOutExpr,
  excludeOutgoingExpr,
  excludeRelationExpr,
  excludeWildcardRef,
  includeElementKindOrTag,
  includeElementRef,
  includeExpandedElementExpr,
  includeIncomingExpr,
  includeInOutExpr,
  includeOutgoingExpr,
  includeRelationExpr,
  includeWildcardRef,
  type RelationPredicateFn
} from './predicates'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ComputeCtx {
  // Intermediate ComputedEdge
  export interface Edge {
    source: Element
    target: Element
    relations: Relation[]
  }
}

function compareEdges(a: ComputeCtx.Edge, b: ComputeCtx.Edge) {
  return compareRelations(
    { source: a.source.id, target: a.target.id },
    { source: b.source.id, target: b.target.id }
  )
}

// If there is only one relation and it has same source and target as edge
function isDirectEdge({ relations: [rel, ...tail], source, target }: ComputeCtx.Edge) {
  if (rel && tail.length === 0) {
    return rel.source === source.id && rel.target === target.id
  }
  return false
}

export class ComputeCtx {
  // Intermediate state
  private explicits = new Set<Element>()
  private implicits = new Set<Element>()
  private ctxEdges = [] as ComputeCtx.Edge[]

  public static elementView(view: ElementView, graph: LikeC4ModelGraph) {
    return new ComputeCtx(view, graph).compute()
  }

  private constructor(
    protected view: ElementView,
    protected graph: LikeC4ModelGraph
  ) {}

  protected compute(): ComputedElementView {
    // reset ctx
    this.reset()
    const {
      docUri: _docUri, // exclude docUri
      rules,
      ...view
    } = this.view

    const viewPredicates = rules.filter(isViewRulePredicate)
    if (this.root && viewPredicates.length == 0) {
      this.addElement(this.graph.element(this.root))
    }
    this.processPredicates(viewPredicates)
    this.removeRedundantImplicitEdges()

    const elements = [...this.includedElements]
    const nodesMap = buildComputeNodes(elements)

    const edgesMap = new Map<EdgeId, ComputedEdge>()
    const edges = this.computeEdges()
    for (const edge of edges) {
      edgesMap.set(edge.id, edge)
      const source = nodesMap.get(edge.source)
      const target = nodesMap.get(edge.target)
      invariant(source, `Source node ${edge.source} not found`)
      invariant(target, `Target node ${edge.target} not found`)
      while (edge.parent && !nodesMap.has(edge.parent)) {
        edge.parent = parentFqn(edge.parent)
      }
      source.outEdges.push(edge.id)
      target.inEdges.push(edge.id)
      // Process edge source ancestors
      for (const sourceAncestor of ancestorsFqn(edge.source)) {
        if (sourceAncestor === edge.parent) {
          break
        }
        nodesMap.get(sourceAncestor)?.outEdges.push(edge.id)
      }
      // Process target hierarchy
      for (const targetAncestor of ancestorsFqn(edge.target)) {
        if (targetAncestor === edge.parent) {
          break
        }
        nodesMap.get(targetAncestor)?.inEdges.push(edge.id)
      }
    }

    // nodesMap sorted hierarchically,
    // but we need to keep the initial sort
    const initialSort = elements.flatMap(e => nodesMap.get(e.id) ?? [])

    const nodes = applyCustomElementProperties(
      rules,
      applyViewRuleStyles(
        rules,
        // Build graph and apply postorder sort
        sortNodes({
          nodes: initialSort,
          edges
        })
      )
    )
    const sortedEdges = new Set([
      ...nodes.flatMap(n => n.children.length === 0 ? n.outEdges.flatMap(id => edgesMap.get(id) ?? []) : []),
      ...edges
    ])

    const autoLayoutRule = this.view.rules.findLast(isViewRuleAutoLayout)

    const elementNotations = buildElementNotations(nodes)

    return calcViewLayoutHash({
      ...view,
      autoLayout: autoLayoutRule?.autoLayout ?? 'TB',
      nodes: map(nodes, omit(['notation'])),
      edges: applyCustomRelationProperties(rules, nodes, sortedEdges),
      ...(elementNotations.length > 0 && {
        notation: {
          elements: elementNotations
        }
      })
    })
  }

  protected get root() {
    return isScopedElementView(this.view) ? this.view.viewOf : null
  }

  protected computeEdges(): ComputedEdge[] {
    return this.ctxEdges.map((e): ComputedEdge => {
      invariant(hasAtLeast(e.relations, 1), 'Edge must have at least one relation')
      const relations = sort(e.relations, compareRelations)
      const source = e.source.id
      const target = e.target.id

      const edge: ComputedEdge = {
        id: `${source}:${target}` as EdgeId,
        parent: commonAncestor(source, target),
        source,
        target,
        label: null,
        relations: relations.map(r => r.id)
      }

      let relation: {
        // TODO refactor with type-fest
        title: string
        description?: string | undefined
        technology?: string | undefined
        kind?: RelationshipKind | undefined
        color?: Color | undefined
        line?: RelationshipLineType | undefined
        head?: RelationshipArrowType | undefined
        tail?: RelationshipArrowType | undefined
        tags?: NonEmptyArray<Tag>
        navigateTo?: ViewID | undefined
      } | undefined
      relation = relations.length === 1 ? relations[0] : relations.find(r => r.source === source && r.target === target)

      // This edge represents mutliple relations
      // We use label if only it is the same for all relations
      if (!relation) {
        const allprops = pipe(
          relations,
          reduce((acc, r) => {
            if (isTruthy(r.title) && !acc.title.includes(r.title)) {
              acc.title.push(r.title)
            }
            if (isTruthy(r.description) && !acc.description.includes(r.description)) {
              acc.description.push(r.description)
            }
            if (isTruthy(r.technology) && !acc.technology.includes(r.technology)) {
              acc.technology.push(r.technology)
            }
            if (isTruthy(r.kind) && !acc.kind.includes(r.kind)) {
              acc.kind.push(r.kind)
            }
            if (isTruthy(r.color) && !acc.color.includes(r.color)) {
              acc.color.push(r.color)
            }
            if (isTruthy(r.line) && !acc.line.includes(r.line)) {
              acc.line.push(r.line)
            }
            if (isTruthy(r.head) && !acc.head.includes(r.head)) {
              acc.head.push(r.head)
            }
            if (isTruthy(r.tail) && !acc.tail.includes(r.tail)) {
              acc.tail.push(r.tail)
            }
            if (isTruthy(r.navigateTo) && !acc.navigateTo.includes(r.navigateTo)) {
              acc.navigateTo.push(r.navigateTo)
            }
            return acc
          }, {
            title: [] as string[],
            description: [] as string[],
            technology: [] as string[],
            kind: [] as RelationshipKind[],
            head: [] as RelationshipArrowType[],
            tail: [] as RelationshipArrowType[],
            color: [] as Color[],
            line: [] as RelationshipLineType[],
            navigateTo: [] as ViewID[]
          })
        )
        relation = {
          title: only(allprops.title) ?? '[...]',
          description: only(allprops.description),
          technology: only(allprops.technology),
          kind: only(allprops.kind),
          head: only(allprops.head),
          tail: only(allprops.tail),
          color: only(allprops.color),
          line: only(allprops.line),
          navigateTo: only(allprops.navigateTo)
        }
      }

      const tags = unique(flatMap(relations, r => r.tags ?? []))

      return Object.assign(
        edge,
        this.getEdgeLabel(relation),
        isTruthy(relation.description) && { description: relation.description },
        isTruthy(relation.technology) && { technology: relation.technology },
        isTruthy(relation.kind) && { kind: relation.kind },
        relation.color && { color: relation.color },
        relation.line && { line: relation.line },
        relation.head && { head: relation.head },
        relation.tail && { tail: relation.tail },
        relation.navigateTo && { navigateTo: relation.navigateTo },
        hasAtLeast(tags, 1) && { tags }
      )
    })
  }

  protected get includedElements() {
    return new Set([
      ...this.explicits,
      ...this.ctxEdges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<Element>
  }

  protected get resolvedElements() {
    return new Set([
      ...this.explicits,
      ...this.implicits,
      ...this.ctxEdges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<Element>
  }

  protected get edges() {
    return this.ctxEdges
  }

  protected addEdges(edges: ComputeCtx.Edge[]) {
    for (const e of edges) {
      if (!hasAtLeast(e.relations, 1)) {
        continue
      }
      const existing = this.ctxEdges.find(
        _e => _e.source.id === e.source.id && _e.target.id === e.target.id
      )
      if (existing) {
        existing.relations = unique([...existing.relations, ...e.relations])
        continue
      }
      this.ctxEdges.push(e)
    }
  }

  /**
   * Add element explicitly
   * Included even without relationships
   */
  protected addElement(...el: Element[]) {
    for (const r of el) {
      this.explicits.add(r)
      this.implicits.add(r)
    }
  }

  /**
   * Add element implicitly
   * Included if only has relationships
   */
  protected addImplicit(...el: Element[]) {
    for (const r of el) {
      this.implicits.add(r)
    }
  }

  protected excludeElement(...excludes: Element[]) {
    for (const el of excludes) {
      this.ctxEdges = this.ctxEdges.filter(e => e.source.id !== el.id && e.target.id !== el.id)
      this.explicits.delete(el)
      this.implicits.delete(el)
    }
  }

  // protected excludeImplicit(...excludes: Element[]) {
  //   for (const el of excludes) {
  //     this.implicits.delete(el)
  //   }
  // }

  protected excludeRelation(...relations: Relation[]) {
    if (relations.length === 0) {
      return
    }
    const excludedImplicits = new Set<Element>()
    const ctxEdges = pipe(
      this.ctxEdges,
      map(edge => {
        const edgerelations = edge.relations.filter(r => !relations.includes(r))
        if (edgerelations.length === 0) {
          excludedImplicits.add(edge.source)
          excludedImplicits.add(edge.target)
          return null
        }
        if (edgerelations.length !== edge.relations.length) {
          return {
            ...edge,
            relations: edgerelations
          }
        }
        return edge
      }),
      filter(isNonNull)
    )
    if (excludedImplicits.size === 0) {
      return
    }
    this.ctxEdges = ctxEdges
    const remaining = this.includedElements
    if (remaining.size === 0) {
      this.implicits.clear()
      return
    }
    for (const el of excludedImplicits) {
      if (!remaining.has(el)) {
        this.implicits.delete(el)
      }
    }
  }

  protected reset() {
    this.explicits.clear()
    this.implicits.clear()
    this.ctxEdges = []
  }

  // Filter out edges if there are edges between descendants
  // i.e. remove implicit edges, derived from childs
  protected removeRedundantImplicitEdges() {
    const processedRelations = new Set<Relation>()

    // Returns relations, that are not processed/included
    const excludeProcessed = (relations: Relation[]) =>
      relations.reduce((acc, rel) => {
        if (!processedRelations.has(rel)) {
          acc.push(rel)
          processedRelations.add(rel)
        }
        return acc
      }, [] as Relation[])

    // Returns predicate
    const isNestedEdgeOf = (parent: ComputeCtx.Edge) => {
      const { source, target } = parent
      // Checks if edge is between descendants of source and target of the parent edge
      return (edge: ComputeCtx.Edge) => {
        const isSameSource = source.id === edge.source.id
        const isSameTarget = target.id === edge.target.id
        if (isSameSource && isSameTarget) {
          return true
        }
        const isSourceNested = isAncestor(source.id, edge.source.id)
        const isTargetNested = isAncestor(target.id, edge.target.id)
        return (
          (isSourceNested && isTargetNested)
          || (isSameSource && isTargetNested)
          || (isSameTarget && isSourceNested)
        )
      }
    }

    // Sort edges from bottom to top (i.e. from more specific edges to implicit or between ancestors)
    const edges = [...this.ctxEdges].sort(compareEdges).reverse()
    this.ctxEdges = edges.reduce((acc, e) => {
      const relations = excludeProcessed(e.relations)
      if (relations.length === 0) {
        return acc
      }
      // If there is an edge between descendants of current edge,
      // then we don't add this edge
      if (acc.length > 0 && acc.some(isNestedEdgeOf(e))) {
        return acc
      }
      acc.push({
        source: e.source,
        target: e.target,
        relations
      })
      return acc
    }, [] as ComputeCtx.Edge[])
  }

  protected processPredicates(viewRules: ViewRulePredicate[]): this {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    for (const rule of viewRules) {
      const isInclude = 'include' in rule
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        if (Expr.isElementPredicateExpr(expr)) {
          this.processElementPredicate(expr, isInclude)
          continue
        }
        if (Expr.isRelationPredicateExpr(expr)) {
          this.processRelationPredicate(expr, isInclude)
          continue
        }
        nonexhaustive(expr)
      }
    }
    return this
  }

  protected processElementPredicate(
    expr: ElementPredicateExpression,
    isInclude: boolean,
    where?: ElementPredicateFn
  ): this {
    if (Expr.isCustomElement(expr)) {
      if (isInclude) {
        this.processElementPredicate(expr.custom.expr, isInclude)
      }
      return this
    }
    if (Expr.isElementWhere(expr)) {
      const where = whereOperatorAsPredicate(expr.where.condition)
      this.processElementPredicate(expr.where.expr, isInclude, where)
      return this
    }
    if (Expr.isExpandedElementExpr(expr)) {
      isInclude
        ? includeExpandedElementExpr.call(this, expr, where)
        : excludeExpandedElementExpr.call(this, expr, where)
      return this
    }
    if (Expr.isElementKindExpr(expr) || Expr.isElementTagExpr(expr)) {
      isInclude
        ? includeElementKindOrTag.call(this, expr, where)
        : excludeElementKindOrTag.call(this, expr, where)
      return this
    }
    if (Expr.isElementRef(expr)) {
      isInclude ? includeElementRef.call(this, expr, where) : excludeElementRef.call(this, expr, where)
      return this
    }
    if (Expr.isWildcard(expr)) {
      isInclude ? includeWildcardRef.call(this, expr, where) : excludeWildcardRef.call(this, expr, where)
      return this
    }
    nonexhaustive(expr)
  }

  protected processRelationPredicate(
    expr: RelationPredicateExpression,
    isInclude: boolean,
    where?: RelationPredicateFn
  ): this {
    if (Expr.isCustomRelationExpr(expr)) {
      if (isInclude) {
        this.processRelationPredicate(expr.customRelation.relation, isInclude)
      }
      return this
    }
    if (Expr.isRelationWhere(expr)) {
      const where = whereOperatorAsPredicate(expr.where.condition)
      this.processRelationPredicate(expr.where.expr, isInclude, where)
      return this
    }
    if (Expr.isIncoming(expr)) {
      isInclude ? includeIncomingExpr.call(this, expr, where) : excludeIncomingExpr.call(this, expr, where)
      return this
    }
    if (Expr.isOutgoing(expr)) {
      isInclude ? includeOutgoingExpr.call(this, expr, where) : excludeOutgoingExpr.call(this, expr, where)
      return this
    }
    if (Expr.isInOut(expr)) {
      isInclude ? includeInOutExpr.call(this, expr, where) : excludeInOutExpr.call(this, expr, where)
      return this
    }
    if (Expr.isRelation(expr)) {
      isInclude ? includeRelationExpr.call(this, expr, where) : excludeRelationExpr.call(this, expr, where)
      return this
    }
    nonexhaustive(expr)
  }

  protected getEdgeLabel(
    relation: { title: String | undefined; technology?: String | undefined }
  ): { label: String } | false {
    const labelParts: String[] = []

    if (isTruthy(relation.title)) {
      labelParts.push(relation.title)
    }

    if (isTruthy(relation.technology)) {
      labelParts.push(`[${relation.technology}]`)
    }

    return labelParts.length > 0 && { label: labelParts.join('\n') }
  }
}
