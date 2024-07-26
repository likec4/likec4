import { isSameHierarchy } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import { elementRef } from '../elementRef'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    try {
      const targetEl: ast.Element | undefined = elementRef(el.target)
      const target = targetEl && fqnIndex.getFqn(targetEl)
      if (!target) {
        accept('error', 'Target not found (not parsed/indexed yet)', {
          node: el,
          property: 'target'
        })
      }
      let sourceEl
      if (ast.isExplicitRelation(el)) {
        sourceEl = elementRef(el.source)
        if (!sourceEl) {
          return accept('error', 'Source not found (not parsed/indexed yet)', {
            node: el,
            property: 'source'
          })
        }
      } else {
        sourceEl = el.$container.$container
      }

      const source = fqnIndex.getFqn(sourceEl)

      if (!source) {
        accept('error', 'Source not found (not parsed/indexed yet)', {
          node: el
        })
      }

      if (source && target && isSameHierarchy(source, target)) {
        accept('error', 'Invalid parent-child relationship', {
          node: el
        })
      }

      if (el.tags?.values && el.body?.tags?.values) {
        accept('error', 'Relation cannot have tags in both header and body', {
          node: el,
          property: 'tags'
        })
      }
    } catch (e) {
      logError(e)
    }
  }
}
