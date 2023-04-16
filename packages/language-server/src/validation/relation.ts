import type { ValidationCheck } from 'langium'
import type { ast } from '../ast'
import { resolveRelationPoints } from '../ast'
import { isSameHierarchy } from '@likec4/core/utils'
import type { LikeC4Services } from '../module'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    try {
      const coupling = resolveRelationPoints(el)
      const target = fqnIndex.get(coupling.target)
      if (!target) {
        return accept('error', 'Invalid target', {
          node: el,
          property: 'target'
        })
      }
      const source = fqnIndex.get(coupling.source)
      if (!source) {
        return accept('error', 'Invalid source', {
          node: el
        })
      }
      if (isSameHierarchy(source, target)) {
        return accept('error', 'Invalid relation (same hierarchy)', {
          node: el
        })
      }
    } catch (e) {
      if (e instanceof Error) {
        return accept('error', e.message, {
          node: el
        })
      }
      accept('error', 'Invalid relation', {
        node: el
      })
    }
    // const fqn = fqnIndex.get(el)
    // if (!fqn) {
    //   accept('error', 'Not indexed', {
    //     node: el,
    //     property: 'name',
    //   })
    //   return
    // }
    // const withSameFqn = fqnIndex.byFqn(fqn)
    // if (withSameFqn.length > 1) {
    //   accept('error', `Duplicate element name ${el.name !== fqn ? el.name +' (' + fqn + ')' : el.name}`, {
    //     node: el,
    //     property: 'name',
    //   })
    // }
  }
}
