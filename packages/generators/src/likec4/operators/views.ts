import {
  hasProp,
  invariant,
  nonexhaustive,
} from '@likec4/core'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { hasAtLeast, values } from 'remeda'
import { schemas } from '../schemas'
import {
  type Op,
  body,
  foreach,
  foreachNewLine,
  guard,
  indent,
  inlineText,
  lazy,
  lines,
  merge,
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

export const deploymentViewRuleIncludeAncestors = zodOp(schemas.views.deploymentViewRuleIncludeAncestors)(
  spaceBetween(
    print('includeAncestors'),
    printProperty('includeAncestors'),
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

// --- Deployment View ---

export const deploymentViewRule = zodOp(schemas.views.deploymentViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx || 'exclude' in ctx) {
      return exec(ctx, viewRulePredicate())
    }
    if ('includeAncestors' in ctx) {
      return exec(ctx, deploymentViewRuleIncludeAncestors())
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
          descriptionProperty(),
          linksProperty(),
        ),
        property(
          'rules',
          foreachNewLine(
            deploymentViewRule(),
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
    stepTarget(),
  ),
)

const bodyWithSteps = <A extends { steps: Array<schemas.views.dynamicViewStep.Data> }>(): Op<A> =>
  property(
    'steps',
    body(
      foreachNewLine(
        lazy(() => stepAny()),
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
          stepTarget(),
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
          stepAltBranch(),
        ),
      ),
    ),
  ),
)

const stepAny = zodOp(schemas.views.dynamicViewStep)(({ ctx, exec }) => {
  if (ctx.source && ctx.target) {
    return exec(ctx, stepSingle())
  }
  invariant(ctx._type, 'Step must have a type')
  switch (ctx._type) {
    case 'loop':
    case 'opt':
    case 'break':
    case 'par':
      return exec(ctx, stepBlock())
    case 'alt':
      return exec(ctx, stepAlt())
    case 'series':
      return exec(ctx, stepSeries())
    case 'try':
      return exec(ctx, stepTry())
    default:
      nonexhaustive(ctx)
  }
})

export const step = {
  single: stepSingle,
  block: stepBlock,
  alt: stepAlt,
  series: stepSeries,
  try: stepTry,
  any: stepAny,
} as const

export const dynamicViewIncludeRule = zodOp(schemas.views.dynamicViewIncludeRule)(({ ctx, exec }) => {
  if (!hasAtLeast(ctx.include, 1)) {
    return
  }

  const isMultiple = hasAtLeast(ctx.include, 2)

  const exprOp = withctx(ctx.include)(
    foreach(
      expression(),
      separateComma(isMultiple),
    ),
  )

  exec(
    ctx,
    merge(
      print('include'),
      ...(isMultiple ? [indent(exprOp)] : [space(), exprOp]),
    ),
  )
})

export const dynamicViewRule = zodOp(schemas.views.dynamicViewRule)(
  ({ ctx, exec }) => {
    if ('include' in ctx) {
      return exec(ctx, dynamicViewIncludeRule())
    }
    if ('predicateId' in ctx) {
      return exec(ctx, viewRuleGlobalPredicate())
    }
    if ('targets' in ctx && 'style' in ctx) {
      return exec(ctx, viewRuleStyle())
    }
    if ('styleId' in ctx) {
      return exec(ctx, viewRuleGlobalStyle())
    }
    if ('direction' in ctx) {
      return exec(ctx, viewRuleAutoLayout())
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
          descriptionProperty(),
          linksProperty(),
          property('variant'),
        ),
        property(
          'steps',
          foreachNewLine(
            step.any(),
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
  ),
)

// --- Parsed View ---
export const anyView = zodOp(schemas.views.anyView)(({ ctx, exec }) => {
  if ('_type' in ctx) {
    if (ctx._type == 'element') {
      return exec(ctx, elementView())
    }
    if (ctx._type === 'deployment') {
      return exec(ctx, deploymentView())
    }
    if (ctx._type === 'dynamic') {
      return exec(ctx, dynamicView())
    }
  }
  nonexhaustive(ctx)
})

export const views = zodOp(schemas.views.views)(
  body('views')(
    select(
      ctx => values(ctx),
      foreach(
        anyView(),
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
