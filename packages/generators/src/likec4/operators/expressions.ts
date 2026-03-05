import { type PredicateSelector, nonexhaustive } from '@likec4/core'
import { joinToNode } from 'langium/generate'
import { map } from 'remeda'
import * as schemas from '../schemas/expression'
import {
  type Output,
  body,
  executeOnFresh,
  fresh,
  indent,
  lazy,
  merge,
  print,
  property,
  space,
  spaceBetween,
  withctx,
  zodOp,
} from './base'
import {
  descriptionProperty,
  markdownProperty,
  notationProperty,
  notesProperty,
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

export const whereTagEqual = zodOp(schemas.whereTag)(function whereTagEqualOp({ ctx: { tag }, out }) {
  if ('eq' in tag) {
    return out.appendTemplate`tag is #${tag.eq}`
  }
  if ('neq' in tag) {
    return out.appendTemplate`tag is not #${tag.neq}`
  }
  nonexhaustive(tag)
})

export const whereKindEqual = zodOp(schemas.whereKind)(function whereKindEqualOp({ ctx: { kind }, out }) {
  if ('eq' in kind) {
    return out.appendTemplate`kind is ${kind.eq}`
  }
  if ('neq' in kind) {
    return out.appendTemplate`kind is not ${kind.neq}`
  }
  nonexhaustive(kind)
})

export const whereNot = zodOp(schemas.whereNot)(
  property(
    'not',
    spaceBetween(
      print('not ('),
      lazy(() => whereOperator()),
      print(')'),
    ),
  ),
)

export const whereParticipant = zodOp(schemas.whereParticipant)(
  function whereParticipantOp({ ctx: { participant, operator }, out }) {
    out.append(participant, '.')
    if ('tag' in operator) {
      whereTagEqual()({ ctx: operator, out })
      return
    }
    if ('kind' in operator) {
      whereKindEqual()({ ctx: operator, out })
      return
    }
    nonexhaustive(operator)
  },
)

export const whereAnd = zodOp(schemas.whereAnd)(function whereAndOp({ ctx: { and }, out }) {
  const operands = map(and, operand => {
    let { out } = executeOnFresh(operand, whereOperator())
    const wrapWithBraces = 'or' in operand
    if (wrapWithBraces) {
      out = fresh().out.append('(', ...out.contents, ')')
    }
    return out
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

export const whereOr = zodOp(schemas.whereOr)(({ ctx: { or }, out }) => {
  const operands = map(or, operand => {
    let { out } = executeOnFresh(operand, whereOperator())
    const wrapWithBraces = 'and' in operand
    if (wrapWithBraces) {
      out = fresh().out.append('(', ...out.contents, ')')
    }
    return out
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

export const whereOperator = zodOp(schemas.whereOperator)(({ ctx, exec }) => {
  if ('and' in ctx) {
    return exec(ctx, whereAnd())
  }
  if ('or' in ctx) {
    return exec(ctx, whereOr())
  }
  if ('not' in ctx) {
    return exec(ctx, whereNot())
  }
  if ('tag' in ctx) {
    return exec(ctx, whereTagEqual())
  }
  if ('kind' in ctx) {
    return exec(ctx, whereKindEqual())
  }
  if ('participant' in ctx) {
    return exec(ctx, whereParticipant())
  }
  nonexhaustive(ctx)
})

export const fqnExpr = zodOp(schemas.fqnExpr)(({ ctx, out }) => {
  if ('wildcard' in ctx) {
    return out.append('*')
  }
  if ('elementKind' in ctx) {
    return out
      .append('element.kind')
      .append(ctx.isEqual ? ' = ' : ' != ')
      .append(ctx.elementKind)
  }
  if ('elementTag' in ctx) {
    return out
      .append('element.tag')
      .append(ctx.isEqual ? ' = ' : ' != ')
      .append(`#${ctx.elementTag}`)
  }
  if ('ref' in ctx) {
    if ('model' in ctx.ref) {
      out.append(ctx.ref.model)
    } else {
      out.append(ctx.ref.deployment)
      if (ctx.ref.element) {
        out.append('.', ctx.ref.element)
      }
    }
    appendSelector(out, ctx.selector)
    return out
  }
  nonexhaustive(ctx)
})

export const fqnExprCustom = zodOp(schemas.fqnExprCustom)(({ ctx: { custom }, exec }) => {
  exec(
    custom.expr,
    fqnExprOrWhere(),
  )
  const customOp = withctx(custom)(
    body('with')(
      titleProperty(),
      descriptionProperty(),
      notationProperty(),
      notesProperty(),
      property('navigateTo'),
      styleProperties(),
    ),
  )
  if ('where' in custom.expr) {
    return exec(
      {},
      indent(
        customOp,
      ),
    )
  }
  return exec(
    {},
    space(),
    customOp,
  )
})

export const fqnExprOrWhere = zodOp(schemas.fqnExprOrWhere)(({ ctx, exec }) => {
  if ('where' in ctx) {
    exec(ctx.where.expr, fqnExpr())
    exec(
      ctx.where.condition,
      indent(
        print('where'),
        indent(
          whereOperator(),
        ),
      ),
    )
    return
  }
  exec(ctx, fqnExpr())
})

export const fqnExprAny = zodOp(schemas.fqnExprAny)(({ ctx, out }) => {
  if ('custom' in ctx) {
    return fqnExprCustom()({ ctx, out })
  }
  return fqnExprOrWhere()({ ctx, out })
})

// ──────────────────────────────────────────────
// RelationExpr operators (expression.ts types)
// ──────────────────────────────────────────────

export const directRelationExpr = zodOp(schemas.directRelationExpr)(
  merge(
    property(
      'source',
      fqnExpr(),
    ),
    print(v => v.isBidirectional ? ' <-> ' : ' -> '),
    property(
      'target',
      fqnExpr(),
    ),
  ),
)

export const incomingRelationExpr = zodOp(schemas.incomingRelationExpr)(
  merge(
    print('-> '),
    property(
      'incoming',
      fqnExpr(),
    ),
  ),
)

export const outgoingRelationExpr = zodOp(schemas.outgoingRelationExpr)(
  merge(
    property(
      'outgoing',
      fqnExpr(),
    ),
    print(' ->'),
  ),
)

export const inOutRelationExpr = zodOp(schemas.inoutRelationExpr)(
  merge(
    print('-> '),
    property(
      'inout',
      fqnExpr(),
    ),
    print(' ->'),
  ),
)

export const relationExpr = zodOp(schemas.relationExpr)(({ ctx, exec }) => {
  if ('source' in ctx) {
    return exec(ctx, directRelationExpr())
  }
  if ('incoming' in ctx) {
    return exec(ctx, incomingRelationExpr())
  }
  if ('outgoing' in ctx) {
    return exec(ctx, outgoingRelationExpr())
  }
  if ('inout' in ctx) {
    return exec(ctx, inOutRelationExpr())
  }
  nonexhaustive(ctx)
})

export const relationExprOrWhere = zodOp(schemas.relationExprOrWhere)(({ ctx, out }) => {
  if ('where' in ctx) {
    return merge(
      withctx(ctx.where.expr)(
        relationExpr(),
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
  return relationExpr()({ ctx, out })
})

export const relationExprCustom = zodOp(schemas.relationExprCustom)(({ ctx: { customRelation }, exec }) => {
  exec(
    customRelation.expr,
    relationExprOrWhere(),
  )

  const customOp = withctx(customRelation)(
    body('with')(
      titleProperty(),
      descriptionProperty(),
      notationProperty(),
      markdownProperty('notes'),
      property('navigateTo'),
      styleProperties(),
      property('head'),
      property('tail'),
      property('line'),
    ),
  )
  const hasWhere = 'where' in customRelation.expr

  if (hasWhere) {
    exec({}, indent(customOp))
  } else {
    exec({}, space(), customOp)
  }
})

export const relationExprAny = zodOp(schemas.relationExprAny)(({ ctx, exec }) => {
  if ('customRelation' in ctx) {
    return exec(ctx, relationExprCustom())
  }
  return exec(ctx, relationExprOrWhere())
})

// ──────────────────────────────────────────────
// Expression dispatcher (expression.ts types)
// ──────────────────────────────────────────────

export const expression = zodOp(schemas.expression)(({ ctx, exec }) => {
  if ('custom' in ctx) {
    return exec(ctx, fqnExprCustom())
  }
  if ('customRelation' in ctx) {
    return exec(ctx, relationExprCustom())
  }
  if ('wildcard' in ctx || 'ref' in ctx || 'elementKind' in ctx || 'elementTag' in ctx) {
    return exec(ctx, fqnExpr())
  }
  if ('source' in ctx || 'incoming' in ctx || 'outgoing' in ctx || 'inout' in ctx) {
    return exec(ctx, relationExpr())
  }
  if ('where' in ctx) {
    const { expr, condition } = ctx.where
    if ('source' in expr || 'incoming' in expr || 'outgoing' in expr || 'inout' in expr) {
      return exec({
        where: {
          expr,
          condition,
        },
      }, relationExprOrWhere())
    }
    return exec({ where: { expr, condition } }, fqnExprOrWhere())
  }
  nonexhaustive(ctx)
})
