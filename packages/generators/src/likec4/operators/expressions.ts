import { nonexhaustive } from '@likec4/core'
import {
  type PredicateSelector,
  Expression,
  FqnExpr,
  FqnRef,
  RelationExpr,
} from '@likec4/core/types'
import { joinToNode } from 'langium/generate'
import { isString, map } from 'remeda'
import type {
  AndOperatorData,
  CustomFqnExprData,
  CustomRelationExprData,
  DirectExprData,
  IncomingExprData,
  InOutExprData,
  KindEqualData,
  ModelExpressionData,
  ModelFqnExprBaseData,
  ModelFqnExprOrWhereData,
  ModelRelationExprBaseData,
  ModelRelationExprOrWhereData,
  NotOperatorData,
  OrOperatorData,
  OutgoingExprData,
  ParticipantOperatorData,
  TagEqualData,
  WhereOperatorData,
} from '../types'
import {
  type Op,
  type Output,
  body,
  fresh,
  indent,
  merge,
  operation,
  print,
  property,
  select,
  space,
  withctx,
} from './base'
import {
  descriptionProperty,
  enumProperty,
  markdownProperty,
  notationProperty,
  styleProperties,
  titleProperty,
} from './properties'

function appendSelector(out: Output, selector: PredicateSelector | undefined) {
  if (selector) {
    switch (selector) {
      case 'children':
        out.append('.*')
        break
      case 'descendants':
        out.append('.**')
        break
      case 'expanded':
        out.append('._')
        break
      default:
        nonexhaustive(selector)
    }
  }
  return out
}

export function whereTagEqual(): Op<TagEqualData> {
  return operation('whereTagEqual', ({ ctx: { tag }, out }) => {
    if (isString(tag)) {
      return out.appendTemplate`tag is #${tag}`
    }
    if ('eq' in tag) {
      return out.appendTemplate`tag is #${tag.eq}`
    }
    if ('neq' in tag) {
      return out.appendTemplate`tag is not #${tag.neq}`
    }
    nonexhaustive(tag)
  })
}

export function whereKindEqual(): Op<KindEqualData> {
  return operation('whereKindEqual', ({ ctx: { kind }, out }) => {
    if (isString(kind)) {
      return out.appendTemplate`kind is ${kind}`
    }
    if ('eq' in kind) {
      return out.appendTemplate`kind is ${kind.eq}`
    }
    if ('neq' in kind) {
      return out.appendTemplate`kind is not ${kind.neq}`
    }
    nonexhaustive(kind)
  })
}

export function whereNot(): Op<NotOperatorData> {
  return merge(
    print('not ( '),
    select(
      c => c.not,
      whereOperator(),
    ),
    print(' )'),
  )
}

export function whereParticipantOperator(): Op<ParticipantOperatorData> {
  return operation('whereParticipantOperator', ({ ctx: { participant, operator }, out }) => {
    out.append(participant, '.')
    if ('tag' in operator) {
      return whereTagEqual()({ ctx: operator, out })
    }
    if ('kind' in operator) {
      return whereKindEqual()({ ctx: operator, out })
    }
    nonexhaustive(operator)
  })
}

export function whereAnd(): Op<AndOperatorData> {
  return operation('whereAnd', ({ ctx: { and }, out }) => {
    const operands = map(and, operand => {
      const ctx = fresh(operand)
      const wrapWithBraces = 'or' in operand
      if (wrapWithBraces) {
        merge(
          print('('),
          whereOperator(),
          print(')'),
        )(ctx)
      } else {
        whereOperator()(ctx)
      }
      return ctx.out
    })
    return out.append(
      joinToNode(operands, {
        appendNewLineIfNotEmpty: true,
        skipNewLineAfterLastItem: true,
        prefix(_element, index) {
          return index > 0 ? 'and ' : undefined
        },
      }),
    )
  })
}

export function whereOr(): Op<OrOperatorData> {
  return operation('whereOr', ({ ctx: { or }, out }) => {
    const operands = map(or, operand => {
      const ctx = fresh(operand)
      const wrapWithBraces = 'and' in operand
      if (wrapWithBraces) {
        merge(
          print('('),
          whereOperator(),
          print(')'),
        )(ctx)
      } else {
        whereOperator()(ctx)
      }
      return ctx.out
    })
    return out.append(
      joinToNode(operands, {
        appendNewLineIfNotEmpty: true,
        skipNewLineAfterLastItem: true,
        prefix(_element, index) {
          return index > 0 ? 'or ' : undefined
        },
      }),
    )
  })
}

export function whereOperator(): Op<WhereOperatorData> {
  return operation('whereOperator', ({ ctx, out }) => {
    if ('and' in ctx) {
      return whereAnd()({ ctx, out })
    }
    if ('or' in ctx) {
      return whereOr()({ ctx, out })
    }
    if ('not' in ctx) {
      return whereNot()({ ctx, out })
    }
    if ('tag' in ctx) {
      return whereTagEqual()({ ctx, out })
    }
    if ('kind' in ctx) {
      return whereKindEqual()({ ctx, out })
    }
    if ('participant' in ctx) {
      return whereParticipantOperator()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function modelExpression(): Op<ModelExpressionData> {
  return operation(({ ctx, out }) => {
    if ('custom' in ctx) {
      return modelCustomFqnExpr()({ ctx, out })
    }
    if ('customRelation' in ctx) {
      return modelCustomRelationExpr()({ ctx, out })
    }
    if ('wildcard' in ctx || 'ref' in ctx || 'elementKind' in ctx || 'elementTag' in ctx) {
      return modelFqnExprOrWhere()({ ctx, out })
    }
    if ('source' in ctx || 'incoming' in ctx || 'outgoing' in ctx || 'inout' in ctx) {
      return modelRelationExprOrWhere()({ ctx, out })
    }
    if ('where' in ctx) {
      const { expr } = ctx.where
      if ('source' in expr || 'incoming' in expr || 'outgoing' in expr || 'inout' in expr) {
        return modelRelationExprOrWhere()({ ctx: ctx as ModelRelationExprOrWhereData, out })
      }
      return modelFqnExprOrWhere()({ ctx: ctx as ModelFqnExprOrWhereData, out })
    }
    nonexhaustive(ctx as never)
  })
}

export function modelFqnExpr(): Op<ModelFqnExprBaseData> {
  return operation('modelFqnExpr', ({ ctx, out }) => {
    if ('wildcard' in ctx) {
      return out.append('*')
    }
    if ('elementKind' in ctx) {
      return out.appendTemplate`element.kind = ${ctx.elementKind}`
    }
    if ('elementTag' in ctx) {
      return out.appendTemplate`element.tag = #${ctx.elementTag}`
    }
    if ('ref' in ctx) {
      out.append(ctx.ref.model)
      appendSelector(out, ctx.selector)
      return out
    }
    nonexhaustive(ctx)
  })
}

export function modelCustomFqnExpr(): Op<CustomFqnExprData> {
  return operation('modelCustomFqnExpr', ({ ctx: { custom }, out }) => {
    const exprOp = withctx(custom.expr)(
      modelFqnExprOrWhere(),
    )
    const customOp = withctx(custom)(
      body('with')(
        titleProperty(),
        descriptionProperty(),
        notationProperty(),
        markdownProperty('notes'),
        enumProperty('navigateTo'),
        styleProperties(),
      ),
    )
    if ('where' in custom.expr) {
      return merge(
        exprOp,
        indent(
          customOp,
        ),
      )({ ctx: custom, out })
    }
    return merge(
      exprOp,
      space(),
      customOp,
    )({ ctx: custom, out })
  })
}

export function modelFqnExprOrWhere(): Op<ModelFqnExprOrWhereData> {
  return operation('modelFqnExprOrWhere', ({ ctx, out }) => {
    if ('where' in ctx) {
      return merge(
        withctx(ctx.where.expr)(
          modelFqnExpr(),
        ),
        indent(
          print('where'),
          indent(
            withctx(ctx.where.condition)(
              whereOperator(),
            ),
          ),
        ),
      )({ ctx, out })
    }
    return modelFqnExpr()({ ctx, out })
  })
}

export function modelDirectRelationExpr(): Op<DirectExprData> {
  return merge(
    property(
      'source',
      modelFqnExpr(),
    ),
    print(v => v.isBidirectional ? ' <-> ' : ' -> '),
    property(
      'target',
      modelFqnExpr(),
    ),
  )
}

export function modelIncomingRelationExpr(): Op<IncomingExprData> {
  return merge(
    print('-> '),
    property(
      'incoming',
      modelFqnExpr(),
    ),
  )
}

export function modelOutgoingRelationExpr(): Op<OutgoingExprData> {
  return merge(
    property(
      'outgoing',
      modelFqnExpr(),
    ),
    print(' ->'),
  )
}

export function modelInOutRelationExpr(): Op<InOutExprData> {
  return merge(
    print('-> '),
    property(
      'inout',
      modelFqnExpr(),
    ),
    print(' ->'),
  )
}

export function modelRelationExpr(): Op<ModelRelationExprBaseData> {
  return operation('modelRelationExpr', ({ ctx, out }) => {
    if ('source' in ctx) {
      return modelDirectRelationExpr()({ ctx, out })
    }
    if ('incoming' in ctx) {
      return modelIncomingRelationExpr()({ ctx, out })
    }
    if ('outgoing' in ctx) {
      return modelOutgoingRelationExpr()({ ctx, out })
    }
    if ('inout' in ctx) {
      return modelInOutRelationExpr()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function modelRelationExprOrWhere(): Op<ModelRelationExprOrWhereData> {
  return operation('modelRelationExprOrWhere', ({ ctx, out }) => {
    if ('where' in ctx) {
      return merge(
        withctx(ctx.where.expr)(
          modelRelationExpr(),
        ),
        indent(
          print('where'),
          indent(
            withctx(ctx.where.condition)(
              whereOperator(),
            ),
          ),
        ),
      )({ ctx, out })
    }
    return modelRelationExpr()({ ctx, out })
  })
}

export function modelCustomRelationExpr(): Op<CustomRelationExprData> {
  return operation('modelCustomRelationExpr', ({ ctx: { customRelation }, out }) => {
    const exprOp = withctx(customRelation.expr)(
      modelRelationExprOrWhere(),
    )
    const customOp = withctx(customRelation)(
      body('with')(
        titleProperty(),
        descriptionProperty(),
        notationProperty(),
        markdownProperty('notes'),
        enumProperty('navigateTo'),
        styleProperties(),
        enumProperty('head'),
        enumProperty('tail'),
        enumProperty('line'),
      ),
    )
    if ('where' in customRelation.expr) {
      return merge(
        exprOp,
        indent(
          customOp,
        ),
      )({ ctx: customRelation, out })
    }
    return merge(
      exprOp,
      space(),
      customOp,
    )({ ctx: customRelation, out })
  })
}

// ──────────────────────────────────────────────
// FqnExpr operators (expression.ts types)
// ──────────────────────────────────────────────

export function fqnExpr(): Op<FqnExpr> {
  return operation('fqnExpr', ({ ctx, out }) => {
    if (FqnExpr.isWildcard(ctx)) {
      return out.append('*')
    }
    if (FqnExpr.isElementKindExpr(ctx)) {
      out.append('element.kind ', ctx.isEqual ? '=' : '!=', ' ', ctx.elementKind)
      return out
    }
    if (FqnExpr.isElementTagExpr(ctx)) {
      out.append('element.tag ', ctx.isEqual ? '=' : '!=', ' #', ctx.elementTag)
      return out
    }
    if (FqnExpr.isModelRef(ctx)) {
      out.append(ctx.ref.model)
      appendSelector(out, ctx.selector)
      return out
    }
    if (FqnExpr.isDeploymentRef(ctx)) {
      out.append(ctx.ref.deployment)
      if (FqnRef.isInsideInstanceRef(ctx.ref)) {
        out.append('.', ctx.ref.element)
      }
      appendSelector(out, ctx.selector)
      return out
    }
    nonexhaustive(ctx)
  })
}

export function fqnExprOrWhere(): Op<FqnExpr.OrWhere> {
  return operation('fqnExprOrWhere', ({ ctx, out }) => {
    if (FqnExpr.isWhere(ctx)) {
      return merge(
        withctx(ctx.where.expr)(
          fqnExpr(),
        ),
        indent(
          print('where'),
          indent(
            withctx(ctx.where.condition as WhereOperatorData)(
              whereOperator(),
            ),
          ),
        ),
      )({ ctx, out })
    }
    return fqnExpr()({ ctx, out })
  })
}

export function fqnCustomExpr(): Op<FqnExpr.Custom> {
  return operation('fqnCustomExpr', ({ ctx: { custom }, out }) => {
    const exprOp = withctx(custom.expr)(
      fqnExprOrWhere(),
    )
    const customOp = withctx(custom)(
      body('with')(
        titleProperty(),
        descriptionProperty(),
        notationProperty(),
        markdownProperty('notes'),
        enumProperty('navigateTo'),
        styleProperties(),
      ),
    )
    if (FqnExpr.isWhere(custom.expr)) {
      return merge(
        exprOp,
        indent(
          customOp,
        ),
      )({ ctx: custom, out })
    }
    return merge(
      exprOp,
      space(),
      customOp,
    )({ ctx: custom, out })
  })
}

export function fqnExprAny(): Op<FqnExpr.Any> {
  return operation('fqnExprAny', ({ ctx, out }) => {
    if (FqnExpr.isCustom(ctx)) {
      return fqnCustomExpr()({ ctx, out })
    }
    return fqnExprOrWhere()({ ctx, out })
  })
}

// ──────────────────────────────────────────────
// RelationExpr operators (expression.ts types)
// ──────────────────────────────────────────────

export function relationDirectExpr(): Op<RelationExpr.Direct> {
  return merge(
    property(
      'source',
      fqnExpr(),
    ),
    print(v => v.isBidirectional ? ' <-> ' : ' -> '),
    property(
      'target',
      fqnExpr(),
    ),
  )
}

export function relationIncomingExpr(): Op<RelationExpr.Incoming> {
  return merge(
    print('-> '),
    property(
      'incoming',
      fqnExpr(),
    ),
  )
}

export function relationOutgoingExpr(): Op<RelationExpr.Outgoing> {
  return merge(
    property(
      'outgoing',
      fqnExpr(),
    ),
    print(' ->'),
  )
}

export function relationInOutExpr(): Op<RelationExpr.InOut> {
  return merge(
    print('-> '),
    property(
      'inout',
      fqnExpr(),
    ),
    print(' ->'),
  )
}

export function relationExpr(): Op<RelationExpr> {
  return operation('relationExpr', ({ ctx, out }) => {
    if (RelationExpr.isDirect(ctx)) {
      return relationDirectExpr()({ ctx, out })
    }
    if (RelationExpr.isIncoming(ctx)) {
      return relationIncomingExpr()({ ctx, out })
    }
    if (RelationExpr.isOutgoing(ctx)) {
      return relationOutgoingExpr()({ ctx, out })
    }
    if (RelationExpr.isInOut(ctx)) {
      return relationInOutExpr()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function relationExprOrWhere(): Op<RelationExpr.OrWhere> {
  return operation('relationExprOrWhere', ({ ctx, out }) => {
    if (RelationExpr.isWhere(ctx)) {
      return merge(
        withctx(ctx.where.expr)(
          relationExpr(),
        ),
        indent(
          print('where'),
          indent(
            withctx(ctx.where.condition as WhereOperatorData)(
              whereOperator(),
            ),
          ),
        ),
      )({ ctx, out })
    }
    return relationExpr()({ ctx, out })
  })
}

export function relationCustomExpr(): Op<RelationExpr.Custom> {
  return operation('relationCustomExpr', ({ ctx: { customRelation }, out }) => {
    const exprOp = withctx(customRelation.expr)(
      relationExprOrWhere(),
    )
    const customOp = withctx(customRelation)(
      body('with')(
        titleProperty(),
        descriptionProperty(),
        notationProperty(),
        markdownProperty('notes'),
        enumProperty('navigateTo'),
        styleProperties(),
        enumProperty('head'),
        enumProperty('tail'),
        enumProperty('line'),
      ),
    )
    if (RelationExpr.isWhere(customRelation.expr)) {
      return merge(
        exprOp,
        indent(
          customOp,
        ),
      )({ ctx: customRelation, out })
    }
    return merge(
      exprOp,
      space(),
      customOp,
    )({ ctx: customRelation, out })
  })
}

// ──────────────────────────────────────────────
// Expression dispatcher (expression.ts types)
// ──────────────────────────────────────────────

export function expression(): Op<Expression> {
  return operation('expression', ({ ctx, out }) => {
    if (Expression.isFqnExpr(ctx)) {
      if (FqnExpr.isCustom(ctx)) {
        return fqnCustomExpr()({ ctx, out })
      }
      return fqnExprOrWhere()({ ctx, out })
    }
    if (Expression.isRelation(ctx)) {
      if (RelationExpr.isCustom(ctx)) {
        return relationCustomExpr()({ ctx, out })
      }
      return relationExprOrWhere()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}
