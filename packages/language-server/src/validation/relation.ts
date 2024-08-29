import { isSameHierarchy } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { isDefined } from 'remeda'
import { ast } from '../ast'
import { elementRef } from '../elementRef'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target'
      })
    }
    let sourceEl
    if (isDefined(el.source)) {
      sourceEl = elementRef(el.source)
      if (!sourceEl) {
        return accept('error', 'Source not resolved', {
          node: el,
          property: 'source'
        })
      }
    } else {
      if (!ast.isElementBody(el.$container)) {
        return accept('error', 'Sourceless relation must be nested', {
          node: el
        })
      }
      sourceEl = el.$container.$container
    }

    const source = fqnIndex.getFqn(sourceEl)

    if (!source) {
      accept('error', 'Source not resolved', {
        node: el
      })
    }

    if (source && target && isSameHierarchy(source, target)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el
      })
    }
  })
}

export const relationBodyChecks = (_services: LikeC4Services): ValidationCheck<ast.RelationBody> => {
  return tryOrLog((body, accept) => {
    const relation = body.$container
    if (relation.tags?.values && body.tags?.values) {
      accept('error', 'Relation cannot have tags in both header and body', {
        node: body.tags
      })
    }
  })
}
