import { isSameHierarchy } from '@likec4/core'
import type { Reference, ValidationCheck } from 'langium'
import { isDefined } from 'remeda'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { importsRef } from '../utils'
import { tryOrLog } from './_shared'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const fqnIndex = services.likec4.FqnIndex

  const resolve = (target: Reference<ast.Referenceable> | undefined) => {
    if (target?.ref?.$type === 'Imported' && target.ref.element?.ref) {
      return fqnIndex.getFqn(target.ref.element.ref)
    }
    if (target?.ref?.$type === 'Element') {
      return fqnIndex.getFqn(target.ref)
    }
    return undefined
  }
  return tryOrLog((el, accept) => {
    const isTargetImported = !!importsRef(el.target)
    const target = resolve(el.target.value)
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
    }

    let source
    if (isDefined(el.source)) {
      source = resolve(el.source.value)
      if (!source) {
        return accept('error', 'Source not resolved', {
          node: el,
          property: 'source',
        })
      }

      const isSourceImported = !!importsRef(el.source)
      if (isSourceImported && isTargetImported) {
        accept('warning', 'Relationship between imported elements is not visible in the other projects', {
          node: el,
        })
      }
      if (isSourceImported && !isTargetImported) {
        accept(
          'warning',
          'Relationship from imported element to local element is not visible in the other project',
          {
            node: el,
          },
        )
      }
    } else {
      if (!ast.isElementBody(el.$container)) {
        return accept('error', 'Sourceless relation must be nested', {
          node: el,
        })
      }
      source = fqnIndex.getFqn(el.$container.$container)
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
