import {
  hasProp,
  isElementView,
  isViewRuleAutoLayout,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  isViewRuleGroup,
  isViewRulePredicate,
  isViewRuleRank,
  isViewRuleStyle,
  nonexhaustive,
} from '@likec4/core'
import type {
  ElementViewPredicate,
  ElementViewRule,
  ElementViewRuleGroup,
  ElementViewRuleRank,
  ElementViewRuleStyle,
  ParsedElementView,
  ParsedView,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from '@likec4/core/types'
import { hasAtLeast, piped, values } from 'remeda'
import {
  type AnyOp,
  type Op,
  body,
  foreach,
  foreachNewLine,
  guard,
  indent,
  lines,
  merge,
  operation,
  print,
  property,
  select,
  spaceBetween,
  withctx,
} from './base'
import { modelExpression } from './expressions'
import {
  descriptionProperty,
  linksProperty,
  notationProperty,
  styleProperties,
  tagsProperty,
  titleProperty,
} from './properties'

export function elementViewRulePredicate(): Op<ElementViewPredicate> {
  return operation('elementViewRule', ({ ctx, out }) => {
    let exprs
    let type
    if ('include' in ctx) {
      exprs = ctx.include
      type = 'include'
    } else {
      exprs = ctx.exclude
      type = 'exclude'
    }

    if (hasAtLeast(exprs, 2)) {
      return merge(
        print(type),
        indent(
          lines(
            ...exprs.map(e => withctx(e, modelExpression())),
          ),
        ),
      )({ ctx, out })
    }
    return spaceBetween(
      print(type),
      ...exprs.map(e => withctx(e, modelExpression())),
    )({ ctx, out })
  })
}
export function elementViewRuleGroup(): Op<ElementViewRuleGroup> {
  throw new Error('not implemented')
}
export function elementViewRuleStyle(): Op<ElementViewRuleStyle> {
  return spaceBetween(
    print('style'),
    property(
      'targets',
      foreach(
        modelExpression(),
        {
          separator: ', ',
        },
      ),
    ),
    body('{', '}')(
      notationProperty(),
      select(
        r => r.style,
        styleProperties(),
      ),
    ),
  )
}
export function elementViewRuleGlobalStyle(): Op<ViewRuleGlobalStyle> {
  throw new Error('not implemented')
}
export function elementViewRuleGlobalPredicateRef(): Op<ViewRuleGlobalPredicateRef> {
  throw new Error('not implemented')
}

export function elementViewRuleAutoLayout(): Op<ViewRuleAutoLayout> {
  const mapping = {
    'TB': 'TopBottom',
    'BT': 'BottomTop',
    'LR': 'LeftRight',
    'RL': 'RightLeft',
  } as const
  return spaceBetween(
    print('autoLayout'),
    property(
      'direction',
      print(v => mapping[v]),
    ),
    guard(
      hasProp('rankSep'),
      spaceBetween(
        property('rankSep'),
        guard(
          hasProp('nodeSep'),
          property('nodeSep'),
        ),
      ),
    ),
  )
}
export function elementViewRuleRank(): Op<ElementViewRuleRank> {
  throw new Error('not implemented')
}

export function elementViewRule(): Op<ElementViewRule> {
  return operation('elementViewRule', ({ ctx, out }) => {
    if (isViewRulePredicate(ctx)) {
      return elementViewRulePredicate()({ ctx, out })
    }
    if (isViewRuleGroup(ctx)) {
      return elementViewRuleGroup()({ ctx, out })
    }
    if (isViewRuleRank(ctx)) {
      return elementViewRuleRank()({ ctx, out })
    }
    if (isViewRuleAutoLayout(ctx)) {
      return elementViewRuleAutoLayout()({ ctx, out })
    }
    if (isViewRuleGlobalStyle(ctx)) {
      return elementViewRuleGlobalStyle()({ ctx, out })
    }
    if (isViewRuleGlobalPredicateRef(ctx)) {
      return elementViewRuleGlobalPredicateRef()({ ctx, out })
    }
    if (isViewRuleStyle(ctx)) {
      return elementViewRuleStyle()({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function elementView(): Op<ParsedElementView> {
  return spaceBetween(
    print('view'),
    print(v => v.id),
    property(
      'viewOf',
      spaceBetween(
        print('of'),
        print(),
      ),
    ),
    body<ParsedElementView>(
      lines(2)(
        lines(
          tagsProperty(),
          titleProperty(),
          descriptionProperty(),
          linksProperty(),
        ),
        property(
          'rules',
          foreachNewLine(
            elementViewRule(),
          ),
        ),
      ),
    ),
  )
}

export function parsedView(): Op<ParsedView> {
  return piped(
    guard(
      isElementView,
      elementView(),
    ),
  )
}

// --- Main ---
type PrintCtx = {
  views: Record<string, ParsedView>
}

export function printViews(ctx: PrintCtx): AnyOp {
  const views = values(ctx.views)

  return body('views')(
    lines(2)(
      ...views.map(v => withctx(v, parsedView())),
    ),
  )
}
