import {
  hasProp,
  isDynamicStep,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
  isDynamicView,
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
  DynamicStep,
  DynamicViewRule,
  DynamicViewStep,
  ElementViewPredicate,
  ElementViewRule,
  ElementViewRuleGroup,
  ElementViewRuleRank,
  ElementViewRuleStyle,
  ParsedDynamicView,
  ParsedElementView,
  ParsedView,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from '@likec4/core/types'
import { hasAtLeast, piped, values } from 'remeda'
import { ModelExpressionSchema } from '../types'
import {
  type AnyOp,
  type Op,
  type Ops,
  type Output,
  body,
  executeOnCtx,
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
} from './base'
import { modelExpression } from './expressions'
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

export function elementViewRulePredicate(): Op<ElementViewPredicate> {
  return operation('elementViewRule', ({ ctx, out }) => {
    const exprs = ctx.include ?? ctx.exclude
    let type = 'include' in ctx ? 'include' : 'exclude'

    if (!hasAtLeast(exprs, 1)) {
      return
    }

    const isMultiple = hasAtLeast(exprs, 2)

    const exprOp = withctx(exprs)(
      foreach(
        guard(
          ModelExpressionSchema,
          modelExpression(),
        ),
        separateComma(isMultiple),
      ),
    )

    executeOnCtx(
      { ctx, out },
      merge(
        print(type),
        ...(isMultiple ? [indent(exprOp)] : [space(), exprOp]),
      ),
    )
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
        guard(
          ModelExpressionSchema,
          modelExpression(),
        ),
        separateComma(),
      ),
    ),
    body('{', '}')(
      notationProperty(),
      property('style', styleProperties()),
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
        printProperty('rankSep'),
        printProperty('nodeSep'),
      ),
    ),
  )
}
export function elementViewRuleRank(): Op<ElementViewRuleRank> {
  throw new Error('not implemented')
}

/**
 * Creates an execution function that runs operations with the given output
 *
 * @see elementViewRule
 */
function execToOut(out: Output) {
  return <A>(ctx: A, ...ops: Ops<A>) => executeOnCtx({ ctx, out }, ops)
}

export function elementViewRule(): Op<ElementViewRule> {
  return operation('elementViewRule', ({ ctx, out }) => {
    const exec = execToOut(out)

    if (isViewRulePredicate(ctx)) {
      return exec(ctx, elementViewRulePredicate())
    }
    if (isViewRuleGroup(ctx)) {
      return exec(ctx, elementViewRuleGroup())
    }
    if (isViewRuleRank(ctx)) {
      return exec(ctx, elementViewRuleRank())
    }
    if (isViewRuleAutoLayout(ctx)) {
      return exec(ctx, elementViewRuleAutoLayout())
    }
    if (isViewRuleGlobalStyle(ctx)) {
      return exec(ctx, elementViewRuleGlobalStyle())
    }
    if (isViewRuleGlobalPredicateRef(ctx)) {
      return exec(ctx, elementViewRuleGlobalPredicateRef())
    }
    if (isViewRuleStyle(ctx)) {
      return exec(ctx, elementViewRuleStyle())
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
  )
}

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
