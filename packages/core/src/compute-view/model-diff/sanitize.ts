import { hasAtLeast, isNonNull, mapValues, pickBy } from 'remeda'
import type {
  AnyAux,
  DynamicViewIncludeRule,
  DynamicViewRule,
  ElementViewPredicate,
  ElementViewRule,
  ElementViewRuleGroup,
  ElementViewRuleStyle,
  GlobalDynamicPredicates,
  GlobalPredicates,
  GlobalStyles,
  ModelGlobals,
  ParsedView,
  Step,
  WithSteps,
} from '../../types'
import {
  FqnRef,
  isDynamicView,
  isElementView,
  isViewRuleGlobalPredicateRef,
  isViewRuleGroup,
  isViewRulePredicate,
  isViewRuleRank,
  isViewRuleStyle,
  ModelExpression,
  ModelFqnExpr,
  ModelRelationExpr,
  stepGuards,
} from '../../types'

/**
 * Tells if an element does not exist in the model state a view is computed for.
 */
type IsMissingElement = (fqn: string) => boolean

function isEndpointMissing<A extends AnyAux>(
  endpoint: ModelRelationExpr.Endpoint<A>,
  isMissing: IsMissingElement,
): boolean {
  return 'ref' in endpoint && FqnRef.isElementRef(endpoint.ref) && isMissing(endpoint.ref.model)
}

function isRelationMissing<A extends AnyAux>(relation: ModelRelationExpr<A>, isMissing: IsMissingElement): boolean {
  switch (true) {
    case ModelRelationExpr.isDirect(relation):
      return isEndpointMissing(relation.source, isMissing) || isEndpointMissing(relation.target, isMissing)
    case ModelRelationExpr.isIncoming(relation):
      return isEndpointMissing(relation.incoming, isMissing)
    case ModelRelationExpr.isOutgoing(relation):
      return isEndpointMissing(relation.outgoing, isMissing)
    case ModelRelationExpr.isInOut(relation):
      return isEndpointMissing(relation.inout, isMissing)
    default:
      return false
  }
}

/**
 * Checks if the expression references an element that does not exist.
 */
function isModelExpressionMissing<A extends AnyAux>(expr: ModelExpression<A>, isMissing: IsMissingElement): boolean {
  switch (true) {
    case ModelExpression.isFqnExpr(expr):
      return isEndpointMissing(ModelFqnExpr.unwrap(expr), isMissing)
    case ModelExpression.isRelationExpr(expr):
      return isRelationMissing(ModelRelationExpr.unwrap(expr), isMissing)
    default:
      return false
  }
}

function withoutMissing<E extends ModelExpression<AnyAux>>(exprs: ReadonlyArray<E>, isMissing: IsMissingElement): E[] {
  return exprs.filter(expr => !isModelExpressionMissing(expr, isMissing))
}

function sanitizePredicate<A extends AnyAux>(
  predicate: ElementViewPredicate<A>,
  isMissing: IsMissingElement,
): ElementViewPredicate<A> | null {
  if (predicate.include) {
    const include = withoutMissing(predicate.include, isMissing)
    return hasAtLeast(include, 1) ? { include } : null
  }
  if (predicate.exclude) {
    const exclude = withoutMissing(predicate.exclude, isMissing)
    return hasAtLeast(exclude, 1) ? { exclude } : null
  }
  return predicate
}

function sanitizeStyle<A extends AnyAux>(
  rule: ElementViewRuleStyle<A>,
  isMissing: IsMissingElement,
): ElementViewRuleStyle<A> | null {
  const targets = withoutMissing(rule.targets, isMissing)
  return hasAtLeast(targets, 1) ? { ...rule, targets } : null
}

function sanitizeGroup<A extends AnyAux>(
  group: ElementViewRuleGroup<A>,
  isMissing: IsMissingElement,
): ElementViewRuleGroup<A> | null {
  const groupRules = group.groupRules
    .map((rule): ElementViewRuleGroup<A>['groupRules'][number] | null => {
      switch (true) {
        case isViewRuleGlobalPredicateRef(rule):
          return rule
        case 'groupRules' in rule:
          return sanitizeGroup(rule, isMissing)
        default:
          return sanitizePredicate(rule, isMissing)
      }
    })
    .filter(isNonNull)
  return hasAtLeast(groupRules, 1) ? { ...group, groupRules } : null
}

function sanitizeElementRule<A extends AnyAux>(
  rule: ElementViewRule<A>,
  isMissing: IsMissingElement,
): ElementViewRule<A> | null {
  switch (true) {
    case isViewRuleGroup(rule):
      return sanitizeGroup(rule, isMissing)
    case isViewRulePredicate(rule):
      return sanitizePredicate(rule, isMissing)
    case isViewRuleStyle(rule):
      return sanitizeStyle(rule, isMissing)
    case isViewRuleRank(rule): {
      const targets = withoutMissing(rule.targets, isMissing)
      return hasAtLeast(targets, 1) ? { ...rule, targets } : null
    }
    default:
      return rule
  }
}

function isStepMissing<A extends AnyAux>(step: Step<A>, isMissing: IsMissingElement): boolean {
  return isMissing(step.source) || isMissing(step.target)
}

function sanitizeSteps<A extends AnyAux>(
  steps: ReadonlyArray<Step.Any<A>>,
  isMissing: IsMissingElement,
): Step.Any<A>[] {
  return steps.map(step => sanitizeStep(step, isMissing)).filter(isNonNull)
}

function sanitizeBlock<A extends AnyAux, B extends WithSteps<A>>(block: B, isMissing: IsMissingElement): B | null {
  const steps = sanitizeSteps(block.steps, isMissing)
  return hasAtLeast(steps, 1) ? { ...block, steps } : null
}

function sanitizeStep<A extends AnyAux>(step: Step.Any<A>, isMissing: IsMissingElement): Step.Any<A> | null {
  switch (true) {
    case stepGuards.isStep(step):
      return isStepMissing(step, isMissing) ? null : step
    case stepGuards.isSeries(step): {
      const steps = step.steps.filter(s => !isStepMissing(s, isMissing))
      return hasAtLeast(steps, 1) ? { ...step, steps } : null
    }
    case stepGuards.isParallel(step):
    case stepGuards.isOpt(step):
    case stepGuards.isLoop(step):
    case stepGuards.isBreak(step):
      return sanitizeBlock(step, isMissing)
    case stepGuards.isTry(step): {
      const tryBlock = sanitizeBlock(step.try, isMissing)
      if (!tryBlock) {
        return null
      }
      const { catch: catchSection, finally: finallySection, ...rest } = step
      const catchBlock = catchSection ? sanitizeBlock(catchSection, isMissing) : null
      const finallyBlock = finallySection ? sanitizeBlock(finallySection, isMissing) : null
      return {
        ...rest,
        try: tryBlock,
        ...(catchBlock && { catch: catchBlock }),
        ...(finallyBlock && { finally: finallyBlock }),
      }
    }
    case stepGuards.isAlt(step): {
      const branches = step.branches.map(branch => sanitizeBlock(branch, isMissing)).filter(isNonNull)
      return hasAtLeast(branches, 1) ? { ...step, branches } : null
    }
    default:
      return step
  }
}

function sanitizeDynamicRule<A extends AnyAux>(
  rule: DynamicViewRule<A>,
  isMissing: IsMissingElement,
): DynamicViewRule<A> | null {
  switch (true) {
    case isViewRuleStyle(rule):
      return sanitizeStyle(rule, isMissing)
    case 'include' in rule && Array.isArray(rule.include): {
      const include = withoutMissing(rule.include, isMissing)
      return hasAtLeast(include, 1) ? { include } : null
    }
    default:
      return rule
  }
}

/**
 * Removes references to missing elements from the view rules.
 *
 * Requires: `isMissing` answers for the model state the view is computed against.
 * Guarantees: the returned view references only existing elements (deployment views are returned unchanged).
 * Returns `null` if the view is scoped to a missing element (the view does not exist in this model state).
 */
export function sanitizeParsedView<A extends AnyAux>(
  view: ParsedView<A>,
  isMissing: IsMissingElement,
): ParsedView<A> | null {
  if (isElementView(view)) {
    if (view.viewOf && isMissing(view.viewOf)) {
      return null
    }
    return {
      ...view,
      rules: view.rules.map(rule => sanitizeElementRule(rule, isMissing)).filter(isNonNull),
    }
  }
  if (isDynamicView(view)) {
    return {
      ...view,
      steps: sanitizeSteps(view.steps, isMissing),
      rules: view.rules.map(rule => sanitizeDynamicRule(rule, isMissing)).filter(isNonNull),
    }
  }
  return view
}

/**
 * Removes references to missing elements from global predicates and styles.
 * Groups left empty are removed (views skip references to unknown global groups).
 */
export function sanitizeGlobals<A extends AnyAux>(
  globals: ModelGlobals<A>,
  isMissing: IsMissingElement,
): ModelGlobals<A> {
  const predicates = mapValues(
    globals.predicates,
    (predicates): ElementViewPredicate<A>[] =>
      predicates.map(predicate => sanitizePredicate(predicate, isMissing)).filter(isNonNull),
  )
  const dynamicPredicates = mapValues(
    globals.dynamicPredicates,
    (rules): DynamicViewIncludeRule<A>[] =>
      rules.flatMap(rule => {
        const include = withoutMissing(rule.include, isMissing)
        return hasAtLeast(include, 1) ? [{ include }] : []
      }),
  )
  const styles = mapValues(
    globals.styles,
    (styles): ElementViewRuleStyle<A>[] => styles.map(style => sanitizeStyle(style, isMissing)).filter(isNonNull),
  )
  return {
    predicates: pickBy(predicates, (v): v is GlobalPredicates<A> => hasAtLeast(v, 1)),
    dynamicPredicates: pickBy(dynamicPredicates, (v): v is GlobalDynamicPredicates<A> => hasAtLeast(v, 1)),
    styles: pickBy(styles, (v): v is GlobalStyles<A> => hasAtLeast(v, 1)),
  }
}
