import type { Fqn } from '@likec4/core/types'
import { difference, toSet } from '@likec4/core/utils'
import { filter, isNonNullish, map, pipe } from 'remeda'
import type { Context } from './actor.types'

/**
 * Derives the state of elements in the view based on the active rules.
 *
 * Categorizes elements into:
 * - Explicitly included: Elements that are both in the view and have an enabled include rule
 * - Implicitly included: Elements in the view without an explicit include rule
 * - Excluded: Elements with an enabled exclude rule that are not in the view
 */
export function deriveElementStates({ rules, view }: Pick<Context, 'rules' | 'view'>): {
  includedExplicit: Set<Fqn>
  includedImplicit: Set<Fqn>
  excluded: Set<Fqn>
  disabled: Set<Fqn>
} {
  const includedInView = new Set(view ? view.nodes.map(node => node.modelRef ?? null).filter(isNonNullish) : [])
  const explicits = pipe(
    rules,
    filter(r => r.type === 'include' && r.enabled),
    map(r => r.expr.ref.model as Fqn),
    toSet(),
  )
  const excluded = pipe(
    rules,
    filter(r => r.type === 'exclude' && r.enabled),
    map(r => r.expr.ref.model as Fqn),
    toSet(),
  )
  const disabled = pipe(
    rules,
    filter(r => !r.enabled),
    map(r => r.expr.ref.model as Fqn),
    toSet(),
  )
  return {
    disabled,
    includedExplicit: explicits,
    includedImplicit: difference(includedInView, explicits),
    excluded: difference(excluded, includedInView),
  }
}

export type ElementStates = ReturnType<typeof deriveElementStates>
