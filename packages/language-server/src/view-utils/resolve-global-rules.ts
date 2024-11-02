import {
  type DynamicView,
  type ElementView,
  type GlobalStyle,
  type GlobalStyleID,
  isDynamicView,
  isElementView,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  type LikeC4View,
  nonexhaustive,
  type ParsedGlobals
} from '@likec4/core'
import { logger } from '@likec4/log'

export function resolveGlobalRules(
  view: LikeC4View,
  globals: ParsedGlobals
): LikeC4View {
  if (isElementView(view)) {
    return resolveInElementView(view, globals)
  } else if (isDynamicView(view)) {
    return resolveInDynamicView(view, globals)
  }
  nonexhaustive(view)
}

function resolveInElementView(
  view: ElementView,
  globals: ParsedGlobals
): LikeC4View {
  const resolvedRules = view.rules
    .flatMap(rule => {
      if (isViewRuleGlobalPredicateRef(rule)) {
        const globalPredicate = globals.predicates[rule.predicateId]
        if (globalPredicate === undefined) {
          logger.warn(`Global predicate not found: ${rule.predicateId}`)
          return []
        }
        return globalPredicate.predicates
      }
      if (isViewRuleGlobalStyle(rule)) {
        const globalStyle = globals.styles[rule.styleId]
        if (globalStyle === undefined) {
          logger.warn(`Global style not found: ${rule.styleId}`)
          return []
        }
        return globalStyle.styles
      } else {
        return rule
      }
    })

  return {
    ...view,
    rules: resolvedRules
  }
}

function resolveInDynamicView(
  view: DynamicView,
  globals: ParsedGlobals
): LikeC4View {
  const resolvedRules = view.rules
    .flatMap(rule => {
      if (isViewRuleGlobalPredicateRef(rule)) {
        const globalPredicate = globals.dynamicPredicates[rule.predicateId]
        if (globalPredicate === undefined) {
          logger.warn(`Global predicate not found: ${rule.predicateId}`)
          return []
        }
        return globalPredicate.dynamicPredicates
      }
      if (isViewRuleGlobalStyle(rule)) {
        const globalStyle = globals.styles[rule.styleId]
        if (globalStyle === undefined) {
          logger.warn(`Global style not found: ${rule.styleId}`)
          return []
        }
        return globalStyle.styles
      } else {
        return rule
      }
    })

  return {
    ...view,
    rules: resolvedRules
  }
}
