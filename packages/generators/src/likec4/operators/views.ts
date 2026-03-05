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
  lines,
  merge,
  print,
  printProperty,
  property,
  select,
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

export const dynamicStep = zodOp(schemas.views.dynamicStep)(
  spaceBetween(
    print(v => v.source),
    print(v => v.isBackward ? '<-' : '->'),
    print(v => v.target),
    body(
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
    ),
  ),
)

export const dynamicStepsSeries = zodOp(schemas.views.dynamicStepsSeries)(({ ctx, exec }) => {
  throw new Error('Not implemented')
})

export const dynamicStepsParallel = zodOp(schemas.views.dynamicStepsParallel)(({ ctx, exec }) => {
  throw new Error('Not implemented')
})

export const dynamicViewStep = zodOp(schemas.views.dynamicViewStep)(({ ctx, exec }) => {
  if ('__series' in ctx) {
    return exec(ctx, dynamicStepsSeries())
  }
  if ('__parallel' in ctx) {
    return exec(ctx, dynamicStepsParallel())
  }
  return exec(ctx, dynamicStep())
})

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
