import {
  hasProp,
  invariant,
  isDynamicStep,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
  isDynamicView,
  isElementView,
  isViewRuleAutoLayout,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  isViewRulePredicate,
  isViewRuleStyle,
  nonexhaustive,
} from '@likec4/core'
import type {
  DynamicStep,
  DynamicViewRule,
  DynamicViewStep,
  ParsedDynamicView,
  ParsedView,
} from '@likec4/core/types'
import { hasAtLeast, piped, values } from 'remeda'
import { schemas } from '../schemas'
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
  printProperty,
  property,
  separateComma,
  space,
  spaceBetween,
  withctx,
  zodOp,
} from './base'
import { expression } from './expressions'
import {
  colorProperty,
  descriptionProperty,
  linksProperty,
  notationProperty,
  notesProperty,
  styleProperties,
  tagsProperty,
  technologyProperty,
  titleProperty,
} from './properties'

export const viewRulePredicate = zodOp(schemas.views.viewRulePredicate)(({ ctx, exec }) => {
  let exprs
  let type
  if ('include' in ctx) {
    exprs = ctx.include
    type = 'include'
  } else if ('exclude' in ctx) {
    exprs = ctx.exclude
    type = 'exclude'
  }
  invariant(exprs && type, 'Invalid view rule predicate')

  if (!hasAtLeast(exprs, 1)) {
    return
  }

  const isMultiple = hasAtLeast(exprs, 2)

  const exprOp = withctx(exprs)(
    foreach(
      expression(),
      separateComma(isMultiple),
    ),
  )

  exec(
    ctx,
    merge(
      print(type),
      ...(isMultiple ? [indent(exprOp)] : [space(), exprOp]),
    ),
  )
})

export const viewRuleStyle = zodOp(schemas.views.viewRuleStyle)(
  spaceBetween(
    print('style'),
    property(
      'targets',
      foreach(
        expression(),
        separateComma(),
      ),
    ),
    body('{', '}')(
      notationProperty(),
      property('style', styleProperties()),
    ),
  ),
)
export const viewRuleGroup = zodOp(schemas.views.viewRuleGroup)(({ ctx, exec }) => {
  throw new Error('not implemented')
})
export const viewRuleGlobalStyle = zodOp(schemas.views.viewRuleGlobalStyle)(({ ctx, exec }) => {
  throw new Error('not implemented')
})
export const viewRuleGlobalPredicate = zodOp(schemas.views.viewRuleGlobalPredicate)(({ ctx, exec }) => {
  throw new Error('not implemented')
})

const mapping = {
  'TB': 'TopBottom',
  'BT': 'BottomTop',
  'LR': 'LeftRight',
  'RL': 'RightLeft',
} as const
export const viewRuleAutoLayout = zodOp(schemas.views.viewRuleAutoLayout)(
  spaceBetween(
    print('autoLayout'),
    property(
      'direction',
      print(v => mapping[v]),
    ),
    guard(
      hasProp('rankSep'),
      spaceBetween(
        printProperty('rankSep'),
        printProperty('nodeSep'),
      ),
    ),
  ),
)

export const viewRuleRank = zodOp(schemas.views.viewRuleRank)(({ ctx, exec }) => {
  throw new Error('not implemented')
})

export const elementViewRule = zodOp(schemas.views.elementViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx || 'exclude' in ctx) {
      return exec(ctx, viewRulePredicate())
    }
    if ('groupRules' in ctx) {
      return exec(ctx, viewRuleGroup())
    }
    if ('rank' in ctx) {
      return exec(ctx, viewRuleRank())
    }
    if ('direction' in ctx) {
      return exec(ctx, viewRuleAutoLayout())
    }
    if ('styleId' in ctx) {
      return exec(ctx, viewRuleGlobalStyle())
    }
    if ('predicateId' in ctx) {
      return exec(ctx, viewRuleGlobalPredicate())
    }
    if ('targets' in ctx && 'style' in ctx) {
      return exec(ctx, viewRuleStyle())
    }
    nonexhaustive(ctx)
  },
)

export const elementView = zodOp(schemas.views.elementView)(
  spaceBetween(
    print('view'),
    print(v => v.id),
    property(
      'viewOf',
      spaceBetween(
        print('of'),
        print(),
      ),
    ),
    body(
      lines(2)(
        // Properties on each line
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
  ),
)

// --- Dynamic View ---

export function dynamicStep(): Op<DynamicStep> {
  return operation('dynamicStep', ({ ctx, out }) => {
    const step = spaceBetween<DynamicStep>(
      print(v => v.source),
      print(v => v.isBackward ? '<-' : '->'),
      print(v => v.target),
    )
    const stepBody = body<DynamicStep>(
      lines(
        titleProperty(),
        technologyProperty(),
        descriptionProperty(),
        notesProperty(),
        property('navigateTo'),
        notationProperty(),
        colorProperty(),
        property('line'),
        property('head'),
        property('tail'),
      ),
    )

    return merge(
      step,
      stepBody,
    )({ ctx, out })
  })
}

export function dynamicStepsSeries(): Op<readonly DynamicStep[]> {
  return foreachNewLine(dynamicStep())
}

export function dynamicStepsParallel(): Op<readonly DynamicViewStep[]> {
  return body('parallel')(
    foreachNewLine(dynamicViewStep()),
  )
}

export function dynamicViewStep(): Op<DynamicViewStep> {
  return operation('dynamicViewStep', ({ ctx, out }) => {
    if (isDynamicStep(ctx)) {
      return dynamicStep()({ ctx, out })
    }
    if (isDynamicStepsSeries(ctx)) {
      return withctx([...ctx.__series] as DynamicStep[], dynamicStepsSeries())({ ctx, out })
    }
    if (isDynamicStepsParallel(ctx)) {
      return withctx([...ctx.__parallel] as DynamicViewStep[], dynamicStepsParallel())({ ctx, out })
    }
    nonexhaustive(ctx)
  })
}

export function dynamicViewRule(): Op<DynamicViewRule> {
  return operation('dynamicViewRule', ({ ctx, out }) => {
    if (isViewRulePredicate(ctx)) {
      return elementViewRulePredicate()({ ctx, out })
    }
    if (isViewRuleStyle(ctx)) {
      return elementViewRuleStyle()({ ctx, out })
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
    nonexhaustive(ctx)
  })
}

export function dynamicView(): Op<ParsedDynamicView> {
  return spaceBetween(
    print('dynamic view'),
    print(v => v.id),
    body<ParsedDynamicView>(
      lines(2)(
        lines(
          tagsProperty(),
          titleProperty(),
          descriptionProperty(),
          linksProperty(),
          property('variant'),
        ),
        property(
          'steps',
          foreachNewLine(
            dynamicViewStep(),
          ),
        ),
        property(
          'rules',
          foreachNewLine(
            dynamicViewRule(),
          ),
        ),
      ),
    ),
  )
}

// --- Parsed View ---

export function parsedView(): Op<ParsedView> {
  return piped(
    guard(
      isElementView,
      elementView(),
    ),
    guard(
      isDynamicView,
      dynamicView(),
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
