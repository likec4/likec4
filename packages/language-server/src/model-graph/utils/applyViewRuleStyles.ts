import { ComputedNode, type ViewRule } from '@likec4/core'
import { Expr, isViewRuleStyle } from '@likec4/core'
import { anyPass, filter, forEach, isDefined, isNot, pipe } from 'remeda'
import { elementExprToPredicate } from './elementExpressionToPredicate'

type Predicate<T> = (x: T) => boolean

export function applyViewRuleStyles(_rules: ViewRule[], nodes: ComputedNode[]) {
  const rules = _rules.filter(isViewRuleStyle)
  if (rules.length === 0) {
    return nodes
  }
  for (const rule of rules) {
    const predicates = [] as Predicate<ComputedNode>[]
    for (const target of rule.targets) {
      if (Expr.isWildcard(target)) {
        predicates.push(() => true)
        break
      }
      predicates.push(elementExprToPredicate(target) as Predicate<ComputedNode>)
    }
    pipe(
      nodes,
      filter(isNot(ComputedNode.isNodesGroup)),
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
        if (styleOverride) {
          n.style = {
            ...n.style,
            ...styleOverride
          }
        }
      })
    )
  }

  return nodes
}
