import { nonexhaustive } from '@likec4/core'
import {
  type AndOperator,
  type KindEqual,
  type NotOperator,
  type OrOperator,
  type ParticipantOperator,
  type PredicateSelector,
  type TagEqual,
  type WhereOperator,
  isAndOperator,
  isKindEqual,
  isNotOperator,
  isOrOperator,
  isParticipantOperator,
  isTagEqual,
  ModelExpression,
  ModelFqnExpr,
  ModelRelationExpr,
} from '@likec4/core/types'
import { joinToNode } from 'langium/generate'
import { isString, map } from 'remeda'
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
import { styleProperties } from './print-style'
import { descriptionProperty, enumProperty, markdownProperty, notationProperty, titleProperty } from './properties'

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

export function whereTagEqual(): Op<TagEqual<any>> {
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

export function whereKindEqual(): Op<KindEqual<any>> {
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

export function whereNot(): Op<NotOperator<any>> {
  return merge(
    print('not ( '),
    select(
      c => c.not,
      whereOperator(),
    ),
    print(' )'),
  )
}

export function whereParticipantOperator(): Op<ParticipantOperator<any>> {
  return operation('whereParticipantOperator', ({ ctx: { participant, operator }, out }) => {
    out.append(participant, '.')
    if (isTagEqual(operator)) {
      return whereTagEqual()({ ctx: operator, out })
    }
    if (isKindEqual(operator)) {
      return whereKindEqual()({ ctx: operator, out })
    }
    nonexhaustive(operator)
  })
}

export function whereAnd(): Op<AndOperator<any>> {
  return operation('whereAnd', ({ ctx: { and }, out }) => {
    const operands = map(and, operand => {
      const ctx = fresh(operand)
      const wrapWithBraces = isOrOperator(operand)
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

export function whereOr(): Op<OrOperator<any>> {
  return operation('whereOr', ({ ctx: { or }, out }) => {
    const operands = map(or, operand => {
      const ctx = fresh(operand)
      const wrapWithBraces = isAndOperator(operand)
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

export function whereOperator(): Op<WhereOperator<any>> {
  return operation('whereOperator', ({ ctx, out }) => {
    if (isAndOperator(ctx)) {
      return whereAnd()({ ctx, out })
    }
    if (isOrOperator(ctx)) {
      return whereOr()({ ctx, out })
    }
    if (isNotOperator(ctx)) {
      return whereNot()({ ctx, out })
    }
    if (isTagEqual(ctx)) {
      return whereTagEqual()({ ctx, out })
    }
    if (isKindEqual(ctx)) {
      return whereKindEqual()({ ctx, out })
    }
    if (isParticipantOperator(ctx)) {
      return whereParticipantOperator()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function modelExpression(): Op<ModelExpression> {
  return operation(({ ctx, out }) => {
    if (ModelExpression.isFqnExpr(ctx)) {
      if (ModelFqnExpr.isCustom(ctx)) {
        return modelCustomFqnExpr()({ ctx, out })
      }
      return modelFqnExprOrWhere()({ ctx, out })
    }
    if (ModelExpression.isRelationExpr(ctx)) {
      if (ModelRelationExpr.isCustom(ctx)) {
        return modelCustomRelationExpr()({ ctx, out })
      }
      return modelRelationExprOrWhere()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function modelFqnExpr(): Op<ModelFqnExpr> {
  return operation('modelFqnExpr', ({ ctx, out }) => {
    if (ModelFqnExpr.isWildcard(ctx)) {
      return out.append('*')
    }
    if (ModelFqnExpr.isElementKindExpr(ctx)) {
      return out.appendTemplate`element.kind = ${ctx.elementKind}`
    }
    if (ModelFqnExpr.isElementTagExpr(ctx)) {
      return out.appendTemplate`element.tag = #${ctx.elementTag}`
    }
    if (ModelFqnExpr.isModelRef(ctx)) {
      out.append(ctx.ref.model)
      appendSelector(out, ctx.selector)
      return out
    }
    nonexhaustive(ctx)
  })
}

export function modelCustomFqnExpr(): Op<ModelFqnExpr.Custom> {
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
    if (ModelFqnExpr.isWhere(custom.expr)) {
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

export function modelFqnExprOrWhere(): Op<ModelFqnExpr.OrWhere> {
  return operation('modelFqnExprOrWhere', ({ ctx, out }) => {
    if (ModelFqnExpr.isWhere(ctx)) {
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

export function modelDirectRelationExpr(): Op<ModelRelationExpr.Direct> {
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

export function modelIncomingRelationExpr(): Op<ModelRelationExpr.Incoming> {
  return merge(
    print('-> '),
    property(
      'incoming',
      modelFqnExpr(),
    ),
  )
}

export function modelOutgoingRelationExpr(): Op<ModelRelationExpr.Outgoing> {
  return merge(
    property(
      'outgoing',
      modelFqnExpr(),
    ),
    print(' ->'),
  )
}

export function modelInOutRelationExpr(): Op<ModelRelationExpr.InOut> {
  return merge(
    print('-> '),
    property(
      'inout',
      modelFqnExpr(),
    ),
    print(' ->'),
  )
}

export function modelRelationExpr(): Op<ModelRelationExpr> {
  return operation('modelRelationExpr', ({ ctx, out }) => {
    if (ModelRelationExpr.isDirect(ctx)) {
      return modelDirectRelationExpr()({ ctx, out })
    }
    if (ModelRelationExpr.isIncoming(ctx)) {
      return modelIncomingRelationExpr()({ ctx, out })
    }
    if (ModelRelationExpr.isOutgoing(ctx)) {
      return modelOutgoingRelationExpr()({ ctx, out })
    }
    if (ModelRelationExpr.isInOut(ctx)) {
      return modelInOutRelationExpr()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function modelRelationExprOrWhere(): Op<ModelRelationExpr.OrWhere> {
  return operation('modelRelationExprOrWhere', ({ ctx, out }) => {
    if (ModelRelationExpr.isWhere(ctx)) {
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

export function modelCustomRelationExpr(): Op<ModelRelationExpr.Custom> {
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
    if (ModelRelationExpr.isWhere(customRelation.expr)) {
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
