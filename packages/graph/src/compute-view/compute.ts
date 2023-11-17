import type {
  ComputedEdge,
  ComputedView,
  EdgeId,
  Element,
  ElementView,
  Relation,
  ViewRuleExpression
} from '@likec4/core'
import {
  Expr,
  ancestorsFqn,
  commonAncestor,
  compareRelations,
  invariant,
  isAncestor,
  isStrictElementView,
  isViewRuleAutoLayout,
  isViewRuleExpression,
  nonNullable,
  nonexhaustive,
  parentFqn
} from '@likec4/core'
import { hasAtLeast, uniq, isTruthy } from 'remeda'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import {
  excludeElementKindOrTag,
  excludeElementRef,
  excludeInOutExpr,
  excludeIncomingExpr,
  excludeOutgoingExpr,
  excludeRelationExpr,
  excludeWildcardRef,
  includeCustomElement,
  includeElementKindOrTag,
  includeElementRef,
  includeInOutExpr,
  includeIncomingExpr,
  includeOutgoingExpr,
  includeRelationExpr,
  includeWildcardRef
} from './compute-predicates'
import { applyElementCustomProperties } from './utils/applyElementCustomProperties'
import { applyViewRuleStyles } from './utils/applyViewRuleStyles'
import { buildComputeNodes } from './utils/buildComputeNodes'
import { sortNodes } from './utils/sortNodes'

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

export class ComputeCtx {
  // Intermediate state
  private ctxElements = new Set<Element>()
  private ctxEdges = [] as ComputeCtx.Edge[]

  public static elementView(view: ElementView, graph: LikeC4ModelGraph) {
    return new ComputeCtx(view, graph).compute()
  }

  private constructor(
    protected view: ElementView,
    protected graph: LikeC4ModelGraph
  ) {}

  protected compute(): ComputedView {
    // reset ctx
    this.reset()
    const { rules, ...view } = this.view

    const viewPredicates = rules.filter(isViewRuleExpression)
    if (this.root && viewPredicates.length == 0) {
      this.addElement(this.graph.element(this.root))
    }
    this.processPredicates(viewPredicates)
    this.removeRedundantImplicitEdges()

    const resolvedElements = [...this.elements]
    const nodesMap = buildComputeNodes(resolvedElements)

    const edges = this.computedEdges.map(edge => {
      while (edge.parent && !nodesMap.has(edge.parent)) {
        edge.parent = parentFqn(edge.parent)
      }
      nonNullable(nodesMap.get(edge.source)).outEdges.push(edge.id)
      nonNullable(nodesMap.get(edge.target)).inEdges.push(edge.id)
      // Process source hierarchy
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

      return edge
    })

    // nodesMap sorted hierarchically,
    // but we need to keep the initial sort
    const initialSort = resolvedElements.flatMap(e => nodesMap.get(e.id) ?? [])

    const nodes = applyElementCustomProperties(
      rules,
      applyViewRuleStyles(
        rules,
        // Build graph and apply postorder sort
        sortNodes(initialSort, edges)
      )
    )

    const edgesMap = new Map<EdgeId, ComputedEdge>(edges.map(e => [e.id, e]))

    const sortedEdges = new Set([
      ...nodes.flatMap(n => n.outEdges.flatMap(id => edgesMap.get(id) ?? [])),
      ...edges
    ])

    const autoLayoutRule = this.view.rules.find(isViewRuleAutoLayout)
    return {
      ...view,
      autoLayout: autoLayoutRule?.autoLayout ?? 'TB',
      nodes,
      edges: Array.from(sortedEdges)
    }
  }

  protected get root() {
    return isStrictElementView(this.view) ? this.view.viewOf : null
  }

  protected get computedEdges(): ComputedEdge[] {
    return this.ctxEdges.map((e): ComputedEdge => {
      invariant(hasAtLeast(e.relations, 1), 'Edge must have at least one relation')
      const relations = [...e.relations].sort(compareRelations)
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

      let relation
      if (relations.length === 1) {
        relation = relations[0]
      } else {
        relation = relations.find(r => r.source === source && r.target === target)
        relation ??= relations.find(r => r.source === source || r.target === target)
      }

      // This edge represents mutliple relations
      // we can't use relation.title, because it is not unique
      if (!relation) {
        const labels = uniq(relations.flatMap(r => (isTruthy(r.title) ? r.title : [])))
        if (hasAtLeast(labels, 1)) {
          if (labels.length === 1) {
            edge.label = labels[0]
          } else {
            edge.label = '[...]'
          }
        }
        return edge
      }

      return Object.assign(
        edge,
        isTruthy(relation.title) && { label: relation.title },
        relation.color && { color: relation.color },
        relation.line && { line: relation.line },
        relation.head && { head: relation.head },
        relation.tail && { tail: relation.tail }
      )
    })
  }

  protected get elements() {
    return new Set([
      ...this.ctxElements,
      ...this.ctxEdges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<Element>
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
        existing.relations = uniq([...existing.relations, ...e.relations])
        continue
      }
      this.ctxEdges.push(e)
    }
  }

  protected addElement(...el: Element[]) {
    for (const r of el) {
      this.ctxElements.add(r)
    }
  }

  protected excludeElement(...excludes: Element[]) {
    for (const el of excludes) {
      this.ctxEdges = this.ctxEdges.filter(e => e.source.id !== el.id && e.target.id !== el.id)
      this.ctxElements.delete(el)
    }
  }

  protected excludeRelation(...relations: Relation[]) {
    for (const relation of relations) {
      let edge
      while ((edge = this.ctxEdges.find(e => e.relations.includes(relation)))) {
        if (edge.relations.length === 1) {
          this.ctxEdges.splice(this.ctxEdges.indexOf(edge), 1)
          continue
        }
        edge.relations = edge.relations.filter(r => r !== relation)
      }
    }
  }

  protected reset() {
    this.ctxElements.clear()
    this.ctxEdges = []
  }

  // Filter out edges if there are edges between descendants
  // i.e. remove implicit edges, derived from childs
  protected removeRedundantImplicitEdges() {
    // Keep the edge, if there is only one relation and it has same source and target as edge
    const isDirectEdge = ({ relations: [rel, ...tail], source, target }: ComputeCtx.Edge) => {
      if (rel && tail.length === 0) {
        return rel.source === source.id && rel.target === target.id
      }
      return false
    }

    // Returns predicate, that checks if edge is between descendants of given edge
    const isNestedEdgeOf = ({ source, target, relations }: ComputeCtx.Edge) => {
      const relationsSet = new Set(relations)
      return (edge: ComputeCtx.Edge) => {
        invariant(
          source.id !== edge.source.id || target.id !== edge.target.id,
          'Edge must not be the same'
        )
        const isSameSource = source.id === edge.source.id || isAncestor(source.id, edge.source.id)
        const isSameTarget = target.id === edge.target.id || isAncestor(target.id, edge.target.id)
        return (
          isSameSource &&
          isSameTarget &&
          // include same relation, i.e. top edge is implicit
          edge.relations.some(rel => relationsSet.has(rel))
        )
      }
    }

    // Sort edges from bottom to top (i.e. implicit edges are at the end)
    const edges = [...this.ctxEdges].sort(compareEdges).reverse()
    this.ctxEdges = edges.reduce((acc, e) => {
      if (acc.length === 0 || isDirectEdge(e)) {
        acc.push(e)
        return acc
      }
      // ignore this edge, if there is already an edge between descendants
      if (acc.some(isNestedEdgeOf(e))) {
        return acc
      }
      acc.push(e)
      return acc
    }, [] as ComputeCtx.Edge[])
  }

  protected processPredicates(viewRules: ViewRuleExpression[]): this {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    for (const rule of viewRules) {
      const isInclude = 'include' in rule
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        if (Expr.isCustomElement(expr)) {
          invariant(isInclude, 'CustomElementExpr is not allowed in exclude rule')
          includeCustomElement.call(this, expr)
          continue
        }
        if (Expr.isElementKindExpr(expr) || Expr.isElementTagExpr(expr)) {
          isInclude
            ? includeElementKindOrTag.call(this, expr)
            : excludeElementKindOrTag.call(this, expr)
          continue
        }
        if (Expr.isElementRef(expr)) {
          isInclude ? includeElementRef.call(this, expr) : excludeElementRef.call(this, expr)
          continue
        }
        if (Expr.isWildcard(expr)) {
          isInclude ? includeWildcardRef.call(this, expr) : excludeWildcardRef.call(this, expr)
          continue
        }
        if (Expr.isIncoming(expr)) {
          isInclude ? includeIncomingExpr.call(this, expr) : excludeIncomingExpr.call(this, expr)
          continue
        }
        if (Expr.isOutgoing(expr)) {
          isInclude ? includeOutgoingExpr.call(this, expr) : excludeOutgoingExpr.call(this, expr)
          continue
        }
        if (Expr.isInOut(expr)) {
          isInclude ? includeInOutExpr.call(this, expr) : excludeInOutExpr.call(this, expr)
          continue
        }
        if (Expr.isRelation(expr)) {
          isInclude ? includeRelationExpr.call(this, expr) : excludeRelationExpr.call(this, expr)
          continue
        }
        nonexhaustive(expr)
      }
    }
    return this
  }
}
