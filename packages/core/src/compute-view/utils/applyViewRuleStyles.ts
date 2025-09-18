import { anyPass, filter, forEach, isDefined, isEmpty, isNot, pipe } from 'remeda'
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

export function applyViewRuleStyle<A extends AnyAux>(
  rule: Pick<AnyViewRuleStyle<A>, 'style' | 'notation'>,
  predicates: Predicate<ComputedNode<A>>[],
  nodes: ComputedNode<A>[],
): void {
  const { shape, color, icon, ...rest } = rule.style
  const nonEmptyStyle = !isEmpty(rest)
  pipe(
    nodes,
    filter(isNot(isGroupElementKind)),
    filter(anyPass(predicates)),
    forEach(n => {
      n.shape = shape ?? n.shape
      n.color = color ?? n.color
      if (isDefined(icon)) {
        n.icon = icon
      }
      if (isDefined(rule.notation)) {
        n.notation = rule.notation
      }
      if (nonEmptyStyle) {
        n.style = {
          ...n.style,
          ...rest,
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
