import { nonexhaustive } from '@likec4/core'
import {
  type AndOperator,
  type KindEqual,
  type ModelExpression,
  type ModelRelationExpr,
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
  ModelFqnExpr,
} from '@likec4/core/types'
import { joinToNode } from 'langium/generate'
import { isString, map } from 'remeda'
import type { Op, Output } from './base'
import {
  fresh,
  merge,
  operation,
  print,
  select,
} from './base'

function appendSelector(out: Output, selector: PredicateSelector | undefined) {
  if (selector) {
    switch (selector) {
      case 'children':
        out.append('.*')
        break
      case 'descendants':
        out.append('.__')
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
    switch (true) {
      case ModelFqnExpr.isWildcard(ctx): {
        return out.append('*')
      }
      case ModelFqnExpr.isElementKindExpr(ctx): {
        return out.appendTemplate`element.kind = ${ctx.elementKind}`
      }
      case ModelFqnExpr.isElementTagExpr(ctx): {
        return out.appendTemplate`element.tag = #${ctx.elementTag}`
      }
      case ModelFqnExpr.isCustom(ctx): {
        return out.appendTemplate`element.custom = ${ctx.custom}`
      }
    }
    throw new Error('Invalid model expression')
  })
}

export function modelFqnExpr(): Op<ModelFqnExpr> {
  return operation('modelFqnExpr', ({ ctx, out }) => {
    switch (true) {
      case ModelFqnExpr.isWildcard(ctx): {
        return out.append('*')
      }
      case ModelFqnExpr.isElementKindExpr(ctx): {
        return out.appendTemplate`element.kind = ${ctx.elementKind}`
      }
      case ModelFqnExpr.isElementTagExpr(ctx): {
        return out.appendTemplate`element.tag = #${ctx.elementTag}`
      }
      case ModelFqnExpr.isModelRef(ctx): {
        out.append(ctx.ref.model)
        appendSelector(out, ctx.selector)
        return out
      }
      default:
        nonexhaustive(ctx)
    }
  })
}

export function modelRelationExpr(): Op<ModelRelationExpr> {
  return operation('modelRelationExpr', ({ ctx, out }) => {
    // TODO
  })
}
