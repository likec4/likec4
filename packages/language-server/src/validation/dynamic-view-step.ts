import { isAncestor } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import { elementRef } from '../elementRef'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

export const dynamicViewStep = (services: LikeC4Services): ValidationCheck<ast.DynamicViewStep> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    try {
      const sourceEl: ast.Element | undefined = elementRef(el.source)
      const source = sourceEl && fqnIndex.getFqn(sourceEl)
      if (!source) {
        accept('error', 'Source not found (not parsed/indexed yet)', {
          node: el,
          property: 'source'
        })
      }

      const targetEl: ast.Element | undefined = elementRef(el.target)
      const target = targetEl && fqnIndex.getFqn(targetEl)
      if (!target) {
        accept('error', 'Target not found (not parsed/indexed yet)', {
          node: el,
          property: 'target'
        })
      }

      if (source && target && (isAncestor(source, target) || isAncestor(target, source))) {
        accept('error', 'Invalid parent-child relationship', {
          node: el
        })
      }
    } catch (e) {
      logError(e)
    }
  }
}
