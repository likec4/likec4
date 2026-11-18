import { isNullish, omitBy } from 'remeda'
import {
  type AnyAux,
  type ComputedEdge,
  type ElementViewRule,
  type Filterable,
  isViewRuleRelationshipStyle,
  scalar,
  whereOperatorAsPredicate,
} from '../../types'

/**
 * Applies `style relationship.tag = ...` rules to the edges of the view, in rule order.
 * Runs before `with { ... }` properties, so a custom relation predicate still wins.
 */
export function applyRelationshipStyles<A extends AnyAux>(
  rules: ElementViewRule<A>[],
  edges: ComputedEdge<A>[],
): ComputedEdge<A>[] {
  const styles = rules.filter(isViewRuleRelationshipStyle).map(({ relationshipStyle: { where, ...style } }) => ({
    satisfies: whereOperatorAsPredicate(where),
    style: omitBy(style, isNullish),
  }))
  if (styles.length === 0) {
    return edges
  }
  return edges.map(edge => {
    const filterable: Filterable<A> = {
      tags: edge.tags ?? null,
      kind: edge.kind === scalar.StepEdgeKind ? null : edge.kind,
    }
    const matched = styles.filter(({ satisfies }) => satisfies(filterable))
    if (matched.length === 0) {
      return edge
    }
    return Object.assign({ ...edge }, ...matched.map(({ style }) => style))
  })
}
