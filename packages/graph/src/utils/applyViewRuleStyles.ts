import type { ComputedNode, ViewRule } from '@likec4/core'
import { Expr, isViewRuleStyle, nonexhaustive, parentFqn } from '@likec4/core'
import { anyPass, filter, type Predicate } from 'rambdax'
import { isDefined, isNullish } from 'remeda'

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
      if (Expr.isElementKindExpr(target)) {
        predicates.push(
          target.isEqual ? n => n.kind === target.elementKind : n => n.kind !== target.elementKind
        )
        continue
      }
      if (Expr.isElementTagExpr(target)) {
        predicates.push(
          target.isEqual
            ? ({ tags }) => !!tags && tags.includes(target.elementTag)
            : ({ tags }) => isNullish(tags) || !tags.includes(target.elementTag)
        )
        continue
      }
      if (Expr.isExpandedElementExpr(target)) {
        predicates.push(n => n.id === target.expanded || parentFqn(n.id) === target.expanded)
        continue
      }
      if (Expr.isElementRef(target)) {
        const { element, isDescedants } = target
        predicates.push(
          isDescedants ? n => n.id.startsWith(element + '.') : n => (n.id as string) === element
        )
        continue
      }
      nonexhaustive(target)
    }
    filter(anyPass(predicates), nodes).forEach(n => {
      n.shape = rule.style.shape ?? n.shape
      n.color = rule.style.color ?? n.color
      if (isDefined.strict(rule.style.icon)) {
        n.icon = rule.style.icon
      }
      let styleOverride: ComputedNode['style'] | undefined
      if (isDefined.strict(rule.style.border)) {
        styleOverride = { ...styleOverride, border: rule.style.border }
      }
      if (isDefined.strict(rule.style.opacity)) {
        styleOverride = { ...styleOverride, opacity: rule.style.opacity }
      }
      if (styleOverride) {
        n.style = {
          ...n.style,
          ...styleOverride
        }
      }
    })
  }

  return nodes
}
