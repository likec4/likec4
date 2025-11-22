import { type ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

export const viewRuleRankChecks = (services: LikeC4Services): ValidationCheck<ast.ViewRuleRank> => {
  return tryOrLog((el, accept) => {
    if (el.targets.length < 2 && el.value === 'same') {
      accept('warning', 'Rank rule should have at least 2 targets', {
        node: el,
        property: 'targets',
      })
    }

    const firstParent = el.targets[0]?.parent
    for (let i = 1; i < el.targets.length; i++) {
      const target = el.targets[i]
      if (!areSame(firstParent, target?.parent)) {
        accept('error', 'All targets must have the same parent', {
          node: el,
          property: 'targets',
          index: i,
        })
      }
    }
  })
}

function areSame(a: ast.FqnRef | undefined, b: ast.FqnRef | undefined): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.value.ref !== b.value.ref) return false
  return areSame(a.parent, b.parent)
}
