import { type ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

// Helper to collect FqnExpr values from FqnExpressions linked list
function collectFqnExprs(exprs: ast.FqnExpressions | undefined): ast.FqnExpr[] {
  const result: ast.FqnExpr[] = []
  let iter: ast.FqnExpressions | undefined = exprs
  while (iter) {
    if (iter.value) {
      result.push(iter.value)
    }
    iter = iter.prev
  }
  return result.reverse()
}

export const viewRuleRankChecks = (_services: LikeC4Services): ValidationCheck<ast.ViewRuleRank> => {
  return tryOrLog((el, accept) => {
    const targetExprs = collectFqnExprs(el.targets)

    if (targetExprs.length < 2 && el.value === 'same') {
      accept('warning', 'Rank rule should have at least 2 targets', {
        node: el,
        property: 'targets',
      })
    }

    // Filter to only FqnRefExpr for parent comparison
    const fqnRefExprs = targetExprs.filter(ast.isFqnRefExpr)

    const firstParent = fqnRefExprs[0]?.ref?.parent
    for (let i = 1; i < fqnRefExprs.length; i++) {
      const target = fqnRefExprs[i]
      if (el.value === 'same' && !areSame(firstParent, target?.ref?.parent)) {
        accept('error', 'All targets must have the same parent rank same', {
          node: el,
          property: 'targets',
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
