import { isSameHierarchy } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import type { ast } from '../ast'
import { resolveRelationPoints } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    try {
      const coupling = resolveRelationPoints(el)
      const target = fqnIndex.getFqn(coupling.target)
      const source = fqnIndex.getFqn(coupling.source)
      if (!target || !source) {
        if (!target) {
          accept('error', 'Target not found', {
            node: el,
            property: 'target'
          })
        }
        if (!source) {
          accept('error', 'Source not found', {
            node: el,
            property: 'source'
          })
        }
        return
      }
      if (isSameHierarchy(source, target)) {
        return accept('error', 'Invalid parent-child relation', {
          node: el
        })
      }
    } catch (e) {
      logError(e)
    }
  }
}
