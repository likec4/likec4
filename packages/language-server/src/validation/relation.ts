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
      let sourceEl: ast.Element | undefined
      if ('source' in el) {
        sourceEl = elementRef(el.source)
      } else {
        if (!ast.isElementBody(el.$container)) {
          accept(
            'error',
            'Invalid relation, expected to have source defined or be inside the element',
            {
              node: el,
              keyword: '->'
            }
          )
        } else {
          sourceEl = el.$container.$container
        }
      }

      const source = sourceEl && fqnIndex.getFqn(sourceEl)

      if (sourceEl && !source) {
        accept('error', 'Source not found (not parsed/indexed yet)', {
          node: el,
          property: 'source'
        })
      }

      if (source && target && isSameHierarchy(source, target)) {
        return accept('error', 'Invalid parent-child relationship', {
          node: el
        })
      }
    } catch (e) {
      logError(e)
    }
  }
}
