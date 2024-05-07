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
  ancestorsFqn,
  commonAncestor,
  compareRelations,
  Expr,
  invariant,
  isAncestor,
  isStrictElementView,
  isViewRuleAutoLayout,
  isViewRuleExpression,
  nonexhaustive,
  parentFqn
} from '@likec4/core'
import { hasAtLeast, isTruthy, unique } from 'remeda'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import {
  excludeElementKindOrTag,
  excludeElementRef,
  excludeIncomingExpr,
  excludeInOutExpr,
  excludeOutgoingExpr,
  excludeRelationExpr,
  excludeWildcardRef,
  includeCustomElement,
  includeElementKindOrTag,
  includeElementRef,
  includeExpandedElementExpr,
  includeIncomingExpr,
  includeInOutExpr,
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

    const elements = [...this.includedElements]
    const nodesMap = buildComputeNodes(elements)

    const edges = this.computedEdges.reduce((acc, edge) => {
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
      acc.push(edge)
      return acc
    }, [] as ComputedEdge[])

    // nodesMap sorted hierarchically,
    // but we need to keep the initial sort
    const initialSort = elements.flatMap(e => nodesMap.get(e.id) ?? [])

    const nodes = applyElementCustomProperties(
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

    const edgesMap = new Map<EdgeId, ComputedEdge>(edges.map(e => [e.id, e]))

    const sortedEdges = new Set([
      ...nodes.flatMap(n => n.children.length === 0 ? n.outEdges.flatMap(id => edgesMap.get(id) ?? []) : []),
      ...edges
    ])

    const autoLayoutRule = this.view.rules.findLast(isViewRuleAutoLayout)
    return {
      ...view,
      autoLayout: autoLayoutRule?.autoLayout ?? 'TB',
      nodes,
      edges: [...sortedEdges]
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
      // We use label if only it is the same for all relations
      if (!relation) {
        const labels = unique(relations.flatMap(r => (isTruthy(r.title) ? r.title : [])))
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

  protected excludeImplicit(...excludes: Element[]) {
    for (const el of excludes) {
      this.implicits.delete(el)
    }
  }

  protected excludeRelation(...relations: Relation[]) {
    const excludedImplicits = new Set<Element>()
    for (const relation of relations) {
      let edge
      while ((edge = this.ctxEdges.find(e => e.relations.includes(relation)))) {
        if (edge.relations.length === 1) {
          excludedImplicits.add(edge.source)
          excludedImplicits.add(edge.target)
          this.ctxEdges.splice(this.ctxEdges.indexOf(edge), 1)
          continue
        }
        edge.relations = edge.relations.filter(r => r !== relation)
      }
    }
    if (excludedImplicits.size === 0) {
      return
    }
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

  protected processPredicates(viewRules: ViewRuleExpression[]): this {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    for (const rule of viewRules) {
      const isInclude = 'include' in rule
      const exprs = rule.include ?? rule.exclude
      for (const expr of exprs) {
        if (Expr.isCustomElement(expr)) {
          if (isInclude) {
            includeCustomElement.call(this, expr)
          }
          continue
        }
        if (Expr.isExpandedElementExpr(expr)) {
          if (isInclude) {
            includeExpandedElementExpr.call(this, expr)
          }
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
