import { difference } from 'rambdax'
import type { ModelIndex } from '../model-index'
import type { Fqn, Element, Relation, ViewRuleExpression, ElementView } from '../types'
import { Expr, isStrictElementView, isViewRuleExpression } from '../types'
import {
  excludeElementKindOrTag,
  excludeElementRef,
  excludeInOutExpr,
  excludeIncomingExpr,
  excludeOutgoingExpr,
  excludeRelationExpr,
  excludeWildcardRef,
  includeElementKindOrTag,
  includeElementRef,
  includeInOutExpr,
  includeIncomingExpr,
  includeOutgoingExpr,
  includeRelationExpr,
  includeWildcardRef
} from './compute-predicates'
import { nonexhaustive } from '../errors'

export type ComputeCtxPatch = {
  elements?: Element[]
  relations?: Relation[]
  implicits?: Element[]
}

export class ComputeCtx {
  public readonly allElements: ReadonlySet<Element>

  constructor(
    public index: ModelIndex,
    public root: Fqn | null,
    public elements: ReadonlySet<Element> = new Set(),
    public relations: ReadonlySet<Relation> = new Set(),
    public implicits: ReadonlySet<Element> = new Set()
  ) {
    this.allElements = new Set([...this.elements, ...this.implicits])
  }

  include({ elements, relations, implicits }: ComputeCtxPatch) {
    return new ComputeCtx(
      this.index,
      this.root,
      elements ? new Set([...this.elements, ...elements]) : this.elements,
      relations ? new Set([...this.relations, ...relations]) : this.relations,
      implicits ? new Set([...this.implicits, ...implicits]) : this.implicits
    )
  }

  exclude({ elements, relations, implicits }: ComputeCtxPatch) {
    let newImplicits = implicits
      ? new Set(difference([...this.implicits], implicits))
      : this.implicits
    if (elements) {
      newImplicits = new Set(difference([...newImplicits], elements))
    }
    return new ComputeCtx(
      this.index,
      this.root,
      elements ? new Set(difference([...this.elements], elements)) : this.elements,
      relations ? new Set(difference([...this.relations], relations)) : this.relations,
      newImplicits
    )
  }

  processViewRules(viewRules: ViewRuleExpression[]): ComputeCtx {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ctx: ComputeCtx = this
    for (const r of viewRules) {
      const isInclude = 'include' in r
      const exprs = r.include ?? r.exclude
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
    return ctx
  }

  static create(view: ElementView, index: ModelIndex) {
    const rootElement = isStrictElementView(view) ? view.viewOf : null
    let ctx = new ComputeCtx(index, rootElement)
    const rulesInclude = view.rules.filter(isViewRuleExpression)
    if (rootElement && rulesInclude.length == 0) {
      ctx = ctx.include({
        elements: [index.find(rootElement)]
      })
    }
    return ctx.processViewRules(rulesInclude)
  }
}
