import { isSameHierarchy } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { isDefined } from 'remeda'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { importsRef } from '../utils'
import { elementRef } from '../utils/elementRef'
import { tryOrLog } from './_shared'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const targetRef = el.target.value.ref
    const isTargetImported = !!importsRef(el.target)
    const target = ast.isElement(targetRef) ? fqnIndex.getFqn(targetRef) : undefined
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
    }

    let sourceEl
    if (isDefined(el.source)) {
      const sourceRef = el.source.value.ref
      sourceEl = ast.isElement(sourceRef) ? sourceRef : undefined
      if (!sourceEl) {
        return accept('error', 'Source not resolved', {
          node: el,
          property: 'source',
        })
      }
    } else {
      if (!ast.isElementBody(el.$container)) {
        return accept('error', 'Sourceless relation must be nested', {
          node: el,
        })
      }
      sourceEl = el.$container.$container
    }

    const source = fqnIndex.getFqn(sourceEl)

    if (!source) {
      accept('error', 'Source not resolved', {
        node: el,
      })
    }

    if (source && target && !isTargetImported && isSameHierarchy(source, target)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const relationBodyChecks = (_services: LikeC4Services): ValidationCheck<ast.RelationBody> => {
  return tryOrLog((body, accept) => {
    const relation = body.$container
    if (relation.tags?.values && body.tags?.values) {
      accept('error', 'Relation cannot have tags in both header and body', {
        node: body.tags,
      })
    }
  })
}
