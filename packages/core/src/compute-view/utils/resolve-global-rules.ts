import { isNullish } from 'remeda'
import { nonexhaustive } from '../../errors'
import {
  type AnyAux,
  type DynamicView,
  type DynamicViewRule,
  type ElementView,
  type ModelGlobals,
  type ViewRule,
  type ViewRuleGlobalPredicateRef,
  type ViewRuleGlobalStyle,
  isDynamicView,
  isElementView,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
} from '../../types'

export function resolveGlobalRules<V extends DynamicView | ElementView>(
  view: V,
  globals: ModelGlobals,
): V {
  if (isElementView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInElementView(view.rules, globals),
    }
  } else if (isDynamicView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInDynamicView(view.rules, globals),
    }
  }
  nonexhaustive(view)
}

type ViewRuleGlobal = ViewRuleGlobalPredicateRef | ViewRuleGlobalStyle

export function resolveGlobalRulesInElementView<M extends AnyAux>(
  rules: ViewRule<M>[],
  globals: ModelGlobals,
): Array<Exclude<ViewRule<M>, ViewRuleGlobal>> {
  return rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.predicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        return acc
      }
      return acc.concat(globalPredicates)
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
  }, [] as Array<Exclude<ViewRule<M>, ViewRuleGlobal>>)
}

export function resolveGlobalRulesInDynamicView<M extends AnyAux>(
  rules: DynamicViewRule<M>[],
  globals: ModelGlobals,
): Array<Exclude<DynamicViewRule<M>, ViewRuleGlobal>> {
  return rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.dynamicPredicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        return acc
      }
      return acc.concat(globalPredicates)
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
