import {
  hasProp,
  invariant,
  nonexhaustive,
} from '@likec4/core'
import { CompositeGeneratorNode } from 'langium/generate'
import { hasAtLeast, values } from 'remeda'
import { NL } from '../../newline'
import { schemas } from '../schemas'
import type { ZExpression } from '../schemas/expression'
import {
  type Op,
  body,
  executeOnCtx,
  foreach,
  foreachNewLine,
  guard,
  indent,
  inlineText,
  lazy,
  lines,
  merge,
  operation,
  print,
  printProperty,
  property,
  select,
  separateComma,
  space,
  spaceBetween,
  text,
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
} from './properties'

const viewTitleProperty = <A extends { title?: string | null | undefined }>(): Op<A> =>
  property(
    'title',
    spaceBetween(
      print('title'),
      inlineText(),
    ),
  )

const viewPredicateOp = <E extends ZExpression.Out[]>(type: 'include' | 'exclude'): Op<E> => {
  return operation<E>('viewPredicateOp', ({ ctx, out }) => {
    const exprs = ctx

    if (!hasAtLeast(exprs, 1)) {
      return
    }

    const isMultiple = hasAtLeast(exprs, 2)

    const exprOp = foreach<E>(
      // print(v => 'custom' in v ? v.custom : v.fqn),
      expression(),
      separateComma(isMultiple),
    )

    executeOnCtx<E>(
      { ctx, out },
      merge(
        print(type),
        ...(isMultiple ? [indent(exprOp)] : [space(), exprOp]),
      ),
    )
  })
}

export const viewRuleInclude = zodOp(schemas.views.viewRuleInclude)(
  property('include', viewPredicateOp('include')),
)
export const viewRuleExclude = zodOp(schemas.views.viewRuleExclude)(
  property('exclude', viewPredicateOp('exclude')),
)

export const viewRulePredicate = zodOp(schemas.views.viewRulePredicate)(({ ctx, exec }) => {
  let exprs
  let type
  if ('include' in ctx) {
    exprs = ctx.include
    type = 'include' as const
  } else if ('exclude' in ctx) {
    exprs = ctx.exclude
    type = 'exclude' as const
  }

  invariant(exprs && type, 'Invalid view rule predicate')

  return exec(exprs, viewPredicateOp(type))
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
    body(
      notationProperty(),
      property('style', styleProperties.noparse()),
    ),
  ),
)
export const viewRuleGroup = zodOp(schemas.views.viewRuleGroup)(({ ctx: _ctx, exec: _exec }) => {
  throw new Error('not implemented')
})
export const viewRuleGlobalStyle = zodOp(schemas.views.viewRuleGlobalStyle)(({ ctx: _ctx, exec: _exec }) => {
  throw new Error('not implemented')
})
export const viewRuleGlobalPredicate = zodOp(schemas.views.viewRuleGlobalPredicate)(({ ctx: _ctx, exec: _exec }) => {
  throw new Error('not implemented')
})

export const viewRuleAutoLayout = zodOp(schemas.views.viewRuleAutoLayout)(
  spaceBetween(
    print('autoLayout'),
    printProperty('direction'),
    guard(
      hasProp('rankSep'),
      spaceBetween(
        printProperty('rankSep'),
        printProperty('nodeSep'),
      ),
    ),
  ),
)

export const deploymentViewRuleIncludeAncestors = zodOp(schemas.views.deploymentViewRuleIncludeAncestors)(
  spaceBetween(
    print('includeAncestors'),
    printProperty('includeAncestors'),
  ),
)

export const viewRuleRank = zodOp(schemas.views.viewRuleRank)(({ ctx: _ctx, exec: _exec }) => {
  throw new Error('not implemented')
})

export const elementViewRule = zodOp(schemas.views.elementViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx) {
      return exec(ctx.include, viewPredicateOp('include'))
    }
    if ('exclude' in ctx) {
      return exec(ctx.exclude, viewPredicateOp('exclude'))
    }
    if ('groupRules' in ctx) {
      return exec(ctx, viewRuleGroup.noparse())
    }
    if ('rank' in ctx) {
      return exec(ctx, viewRuleRank.noparse())
    }
    if ('direction' in ctx) {
      return exec(ctx, viewRuleAutoLayout.noparse())
    }
    if ('styleId' in ctx) {
      return exec(ctx, viewRuleGlobalStyle.noparse())
    }
    if ('predicateId' in ctx) {
      return exec(ctx, viewRuleGlobalPredicate.noparse())
    }
    if ('targets' in ctx && 'style' in ctx) {
      return exec(ctx, viewRuleStyle.noparse())
    }
    nonexhaustive(ctx)
  },
)

export const elementView = zodOp(schemas.views.elementView.partial({ _type: true }))(
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
          viewTitleProperty(),
          property('order'),
          descriptionProperty(),
          linksProperty(),
        ),
        property(
          'rules',
          foreachNewLine(
            elementViewRule.noparse(),
          ),
        ),
      ),
    ),
  ),
)

// --- Deployment View ---

export const deploymentViewRule = zodOp(schemas.views.deploymentViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx) {
      return exec(ctx.include, viewPredicateOp('include'))
    }
    if ('exclude' in ctx) {
      return exec(ctx.exclude, viewPredicateOp('exclude'))
    }
    if ('includeAncestors' in ctx) {
      return exec(ctx, deploymentViewRuleIncludeAncestors.noparse())
    }
    if ('direction' in ctx) {
      return exec(ctx, viewRuleAutoLayout.noparse())
    }
    if ('styleId' in ctx) {
      return exec(ctx, viewRuleGlobalStyle.noparse())
    }
    if ('predicateId' in ctx) {
      return exec(ctx, viewRuleGlobalPredicate.noparse())
    }
    if ('targets' in ctx && 'style' in ctx) {
      return exec(ctx, viewRuleStyle.noparse())
    }
    nonexhaustive(ctx)
  },
)

export const deploymentView = zodOp(schemas.views.deploymentView.partial({ _type: true }))(
  spaceBetween(
    print('deployment view'),
    print(v => v.id),
    body(
      lines(2)(
        // Properties on each line
        lines(
          tagsProperty(),
          viewTitleProperty(),
          property('order'),
          descriptionProperty(),
          linksProperty(),
        ),
        property(
          'rules',
          foreachNewLine(
            deploymentViewRule.noparse(),
          ),
        ),
      ),
    ),
  ),
)

// --- Dynamic View ---

const stepTarget = zodOp(schemas.views.dynamicStep.partial({ source: true }))(
  spaceBetween(
    print(v => {
      if (v.isBackward) {
        return '<-'
      }
      if (v.kind) {
        return `-[${v.kind}]->`
      }
      return '->'
    }),
    printProperty('target'),
    property('title', text()),
    body(
      lines(
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
    ),
  ),
)

const stepSingle = zodOp(schemas.views.dynamicStep)(
  spaceBetween(
    printProperty('source'),
    stepTarget.noparse(),
  ),
)

const bodyWithSteps = <A extends { steps: Array<schemas.views.dynamicViewStep.Data> }>(): Op<A> =>
  property(
    'steps',
    body(
      foreachNewLine(
        lazy(() => stepAny.noparse()),
      ),
    ),
  )

const stepBlock = zodOp(schemas.views.dynamicStepBlock)(
  spaceBetween(
    printProperty('_type'),
    property('title', text()),
    bodyWithSteps(),
  ),
)

const stepSeries = zodOp(schemas.views.dynamicStepSeries)(
  merge(
    select(
      v => v.steps[0]!,
      printProperty('source'),
    ),
    indent(
      property(
        'steps',
        foreachNewLine(
          stepTarget.noparse(),
        ),
      ),
    ),
  ),
)

const stepTry = zodOp(schemas.views.dynamicStepTry)(
  spaceBetween(
    select(
      v => v.try,
      spaceBetween(
        print('try'),
        property('title', text()),
        bodyWithSteps(),
      ),
    ),
    select(
      v => v.catch,
      spaceBetween(
        print('catch'),
        property('title', text()),
        bodyWithSteps(),
      ),
    ),
    select(
      v => v.finally,
      spaceBetween(
        print('finally'),
        property('title', text()),
        bodyWithSteps(),
      ),
    ),
  ),
)

const stepAltBranch = zodOp(schemas.views.dynamicStepAltBranch)(
  spaceBetween(
    printProperty('_type'),
    property('title', text()),
    bodyWithSteps(),
  ),
)

const stepAlt = zodOp(schemas.views.dynamicStepAlt)(
  spaceBetween(
    print('alt'),
    property('title', text()),
    body(
      property(
        'branches',
        foreachNewLine(
          stepAltBranch.noparse(),
        ),
      ),
    ),
  ),
)

const stepSubflow = zodOp(schemas.views.dynamicViewSubflow)(({ ctx, exec }) => {
  switch (ctx._type) {
    case 'alt':
      return exec(ctx, stepAlt.noparse())
    case 'series':
      return exec(ctx, stepSeries.noparse())
    case 'try':
      return exec(ctx, stepTry.noparse())
    case 'par':
    case 'parallel':
    case 'loop':
    case 'opt':
    case 'break':
      return exec(ctx, stepBlock.noparse())
    default:
      nonexhaustive(ctx)
  }
})
export const stepAny = zodOp(schemas.views.dynamicViewStep)(({ ctx, exec }) => {
  if ('source' in ctx && 'target' in ctx) {
    return exec(ctx, stepSingle.noparse())
  }
  invariant(ctx._type, 'Step must have a type')
  return exec(ctx, stepSubflow.noparse())
})

/**
 * Dynamic view step operator that handles all step types
 * Includes single steps (source -> target) and compound steps (alt, series, try, par, loop, opt, break)
 *
 * @example
 * ```likec4

 * ```
 */
export const step = Object.assign(
  stepSingle,
  {
    subflow: stepSubflow,
    block: stepBlock,
    alt: stepAlt,
    series: stepSeries,
    try: stepTry,
    any: stepAny,
  } as const,
)

export const dynamicViewRule = zodOp(schemas.views.dynamicViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx) {
      return exec(ctx.include, viewPredicateOp('include'))
    }
    if ('predicateId' in ctx) {
      return exec(ctx, viewRuleGlobalPredicate.noparse())
    }
    if ('targets' in ctx && 'style' in ctx) {
      return exec(ctx, viewRuleStyle.noparse())
    }
    if ('styleId' in ctx) {
      return exec(ctx, viewRuleGlobalStyle.noparse())
    }
    if ('direction' in ctx) {
      return exec(ctx, viewRuleAutoLayout.noparse())
    }
    nonexhaustive(ctx)
  },
)

export const dynamicView = zodOp(schemas.views.dynamicView.partial({ _type: true }))(
  spaceBetween(
    print('dynamic view'),
    print(v => v.id),
    body(
      lines(2)(
        lines(
          tagsProperty(),
          viewTitleProperty(),
          property('order'),
          descriptionProperty(),
          linksProperty(),
          property('variant'),
        ),
        property(
          'steps',
          foreachNewLine(
            step.any.noparse(),
          ),
        ),
        property(
          'rules',
          foreachNewLine(
            dynamicViewRule.noparse(),
          ),
        ),
      ),
    ),
  ),
)

// --- Parsed View ---
export const anyView = zodOp(schemas.views.anyView)(({ ctx, exec }) => {
  if ('_type' in ctx) {
    if (ctx._type == 'element') {
      return exec(ctx, elementView.noparse())
    }
    if (ctx._type === 'deployment') {
      return exec(ctx, deploymentView.noparse())
    }
    if (ctx._type === 'dynamic') {
      return exec(ctx, dynamicView.noparse())
    }
  }
  nonexhaustive(ctx)
})

export const views = zodOp(schemas.views.views)(
  body('views')(
    select(
      ctx => values(ctx),
      foreach(
        anyView.noparse(),
        {
          // Extra line between
          separator: new CompositeGeneratorNode().appendNewLine().appendNewLine(),
          // Add empty line before first view (if not the last one)
          prefix: (_, index, isLast) => index === 0 && !isLast ? NL : undefined,
        },
      ),
    ),
  ),
)
