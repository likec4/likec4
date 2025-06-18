import { FqnRef, isSameHierarchy } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { safeCall } from '../utils'
import { tryOrLog } from './_shared'

export const relationChecks = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  const modelParser = services.likec4.ModelParser

  return tryOrLog((el, accept) => {
    const parser = modelParser.forDocument(AstUtils.getDocument(el))

    const source = safeCall(() => parser._resolveRelationSource(el))
    if (!source) {
      accept('error', 'Source not resolved', {
        node: el,
        property: 'source',
      })
      return
    }
    const target = safeCall(() => parser.parseFqnRef(el.target))
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
      return
    }

    if (FqnRef.isImportRef(source)) {
      if (FqnRef.isImportRef(target)) {
        accept('warning', 'Relationship between imported elements may not be visible in origin projects', {
          node: el,
        })
      } else {
        accept('warning', 'Relationship from imported element to local element may not be visible in origin project', {
          node: el,
          property: 'source',
        })
      }
    }

    const sourceFqn = FqnRef.flatten(source)
    const targetFqn = FqnRef.flatten(target)
    if (isSameHierarchy(sourceFqn, targetFqn) && sourceFqn !== targetFqn) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const checkRelationBody = (_services: LikeC4Services): ValidationCheck<ast.RelationBody> => {
  return tryOrLog((body, accept) => {
    const relation = body.$container
    if (relation.tags?.values && body.tags?.values) {
      accept('error', 'Relation cannot have tags in both header and body', {
        node: body.tags,
      })
    }
  })
}
