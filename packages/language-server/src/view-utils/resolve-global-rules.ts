import {
  type DynamicView,
  type DynamicViewRule,
  type ElementView,
  isDynamicView,
  isElementView,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  type ModelGlobals,
  nonexhaustive,
  type ViewRule,
  type ViewRuleGlobalPredicateRef,
  type ViewRuleGlobalStyle
} from '@likec4/core'
import { logger } from '@likec4/log'
import { isNullish } from 'remeda'

export function resolveGlobalRules<V extends DynamicView | ElementView>(
  view: V,
  globals: ModelGlobals
): V {
  if (isElementView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInElementView(view, globals)
    }
  } else if (isDynamicView(view)) {
    return {
      ...view,
      rules: resolveGlobalRulesInDynamicView(view, globals)
    }
  }
  nonexhaustive(view)
}

type ViewRuleGlobal = ViewRuleGlobalPredicateRef | ViewRuleGlobalStyle

export function resolveGlobalRulesInElementView(
  view: ElementView,
  globals: ModelGlobals
): Array<Exclude<ViewRule, ViewRuleGlobal>> {
  return view.rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.predicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        logger.warn(`Global predicate not found: ${rule.predicateId}`)
        return acc
      }
      return acc.concat(globalPredicates)
    }
    if (isViewRuleGlobalStyle(rule)) {
      const globalStyles = globals.styles[rule.styleId]
      if (isNullish(globalStyles)) {
        logger.warn(`Global style not found: ${rule.styleId}`)
        return acc
      }
      return acc.concat(globalStyles)
    }
    acc.push(rule)
    return acc
  }, [] as Array<Exclude<ViewRule, ViewRuleGlobal>>)
}

export function resolveGlobalRulesInDynamicView(
  view: DynamicView,
  globals: ModelGlobals
): Array<Exclude<DynamicViewRule, ViewRuleGlobal>> {
  return view.rules.reduce((acc, rule) => {
    if (isViewRuleGlobalPredicateRef(rule)) {
      const globalPredicates = globals.dynamicPredicates[rule.predicateId]
      if (isNullish(globalPredicates)) {
        logger.warn(`Global predicate not found: ${rule.predicateId}`)
        return acc
      }
      return acc.concat(globalPredicates)
    }
    if (isViewRuleGlobalStyle(rule)) {
      const globalStyles = globals.styles[rule.styleId]
      if (isNullish(globalStyles)) {
        logger.warn(`Global style not found: ${rule.styleId}`)
        return acc
      }
      return acc.concat(globalStyles)
    }
    acc.push(rule)
    return acc
  }, [] as Array<Exclude<DynamicViewRule, ViewRuleGlobal>>)
}
