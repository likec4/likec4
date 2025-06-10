import { isNullish } from 'remeda'
import {
  type AnyAux,
  type DynamicViewIncludeRule,
  type DynamicViewRule,
  type ElementViewPredicate,
  type ElementViewRule,
  type ModelGlobals,
  type ParsedDynamicView,
  type ParsedElementView,
  type ViewRuleGlobalPredicateRef,
  type ViewRuleGlobalStyle,
  isDynamicView,
  isElementView,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
} from '../../types'
import { nonexhaustive } from '../../utils'

export function resolveGlobalRules<A extends AnyAux>(
  view: ParsedElementView<A> | ParsedDynamicView<A>,
  globals: ModelGlobals<A>,
) {
  if (isElementView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInElementView(view.rules, globals),
    }
  }

  if (isDynamicView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInDynamicView(view.rules, globals),
    }
  }
  nonexhaustive(view)
}

type ViewRuleGlobal = ViewRuleGlobalPredicateRef | ViewRuleGlobalStyle

export function resolveGlobalRulesInElementView<M extends AnyAux>(
  rules: ElementViewRule<M>[],
  globals: ModelGlobals<M>,
): Array<Exclude<ElementViewRule<M>, ViewRuleGlobal>> {
  return rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.predicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        return acc
      }
      return acc.concat(globalPredicates as ElementViewPredicate<M>[])
    }
    if (isViewRuleGlobalStyle(rule)) {
      const globalStyles = globals.styles[rule.styleId]
      if (isNullish(globalStyles)) {
        return acc
      }
      return acc.concat(globalStyles)
    }
    acc.push(rule)
    return acc
  }, [] as Array<Exclude<ElementViewRule<M>, ViewRuleGlobal>>)
}

export function resolveGlobalRulesInDynamicView<M extends AnyAux>(
  rules: DynamicViewRule<M>[],
  globals: ModelGlobals<M>,
): Array<Exclude<DynamicViewRule<M>, ViewRuleGlobal>> {
  return rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.dynamicPredicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        return acc
      }
      return acc.concat(globalPredicates as DynamicViewIncludeRule<M>[])
    }
    if (isViewRuleGlobalStyle(rule)) {
      const globalStyles = globals.styles[rule.styleId]
      if (isNullish(globalStyles)) {
        return acc
      }
      return acc.concat(globalStyles)
    }
    acc.push(rule)
    return acc
  }, [] as Array<Exclude<DynamicViewRule<M>, ViewRuleGlobal>>)
}
