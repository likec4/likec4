import { anyPass, filter, forEach, isDefined, isNot, pipe } from 'remeda'
import {
  type AnyAux,
  type AnyViewRuleStyle,
  type ComputedNode,
  type ElementViewRule,
  isGroupElementKind,
  isViewRuleStyle,
} from '../../types'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean

type CommonViewRuleStyle = Pick<AnyViewRuleStyle<any>, 'style' | 'notation'>

export function applyViewRuleStyle<Rule extends CommonViewRuleStyle>(
  rule: Rule,
  predicates: Predicate<ComputedNode<any>>[],
  nodes: ComputedNode<any>[],
): void {
  pipe(
    nodes,
    filter(isNot(isGroupElementKind)),
    filter(anyPass(predicates)),
    forEach(n => {
      n.shape = rule.style.shape ?? n.shape
      n.color = rule.style.color ?? n.color
      if (isDefined(rule.style.icon)) {
        n.icon = rule.style.icon
      }
      if (isDefined(rule.notation)) {
        n.notation = rule.notation
      }
      let styleOverride: ComputedNode['style'] | undefined
      if (isDefined(rule.style.border)) {
        styleOverride = { border: rule.style.border }
      }
      if (isDefined(rule.style.opacity)) {
        styleOverride = { ...styleOverride, opacity: rule.style.opacity }
      }
      if (isDefined(rule.style.multiple)) {
        styleOverride = { ...styleOverride, multiple: rule.style.multiple }
      }
      if (isDefined(rule.style.padding)) {
        styleOverride = { ...styleOverride, padding: rule.style.padding }
      }
      if (isDefined(rule.style.size)) {
        styleOverride = { ...styleOverride, size: rule.style.size }
      }
      if (isDefined(rule.style.textSize)) {
        styleOverride = { ...styleOverride, textSize: rule.style.textSize }
      }
      if (styleOverride) {
        n.style = {
          ...n.style,
          ...styleOverride,
        }
      }
    }),
  )
}

export function applyViewRuleStyles<A extends AnyAux, N extends ComputedNode<A>[]>(
  rules: ElementViewRule<A>[],
  nodes: N,
): N {
  for (const rule of rules) {
    if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
      continue
    }
    const predicates = rule.targets.map(elementExprToPredicate)
    applyViewRuleStyle(rule, predicates, nodes)
  }
  return nodes
}
