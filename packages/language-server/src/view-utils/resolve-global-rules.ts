import {
  type DynamicView,
  type ElementView,
  type GlobalStyle,
  type GlobalStyleID,
  isDynamicView,
  isElementView,
  isViewRuleGlobalStyle,
  type LikeC4View,
  nonexhaustive
} from '@likec4/core'
import { logger } from '@likec4/log'

export function resolveGlobalRules(
  view: LikeC4View,
  globalStyles: Record<GlobalStyleID, GlobalStyle>
): LikeC4View {
  if (isElementView(view)) {
    return resolveGlobalStyleInElementView(view, globalStyles)
  } else if (isDynamicView(view)) {
    return resolveGlobalStyleInDynamicView(view, globalStyles)
  }
  nonexhaustive(view)
}

function resolveGlobalStyleInElementView(
  view: ElementView,
  globalStyles: Record<GlobalStyleID, GlobalStyle>
): LikeC4View {
  const resolvedRules = view.rules
    .flatMap(rule => {
      if (isViewRuleGlobalStyle(rule)) {
        const globalStyle = globalStyles[rule.styleId]
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

function resolveGlobalStyleInDynamicView(
  view: DynamicView,
  globalStyles: Record<GlobalStyleID, GlobalStyle>
): LikeC4View {
  const resolvedRules = view.rules
    .flatMap(rule => {
      if (isViewRuleGlobalStyle(rule)) {
        const globalStyle = globalStyles[rule.styleId]
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
