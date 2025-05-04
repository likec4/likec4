import { elementFromActivityId, FqnRef, isSameHierarchy } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom, safeCall } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const checkActivity = (services: LikeC4Services): ValidationCheck<ast.Activity> => {
  const fqnIndex = services.likec4.FqnIndex
  const locator = services.workspace.AstNodeLocator
  return tryOrLog((el, accept) => {
    const fqn = fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Not indexed activity', {
        node: el,
        property: 'name',
      })
      return
    }
    if (RESERVED_WORDS.includes(el.name)) {
      accept('error', `Reserved word: ${el.name}`, {
        node: el,
        property: 'name',
      })
    }
    const doc = getDocument(el)
    const docUri = doc.uri
    const elPath = locator.getAstNodePath(el)
    const withSameFqn = fqnIndex
      .byFqn(projectIdFrom(doc), fqn)
      .filter(v => v.documentUri !== docUri || v.path !== elPath)
      .head()
    if (withSameFqn) {
      const isAnotherDoc = withSameFqn.documentUri !== docUri
      accept(
        'error',
        `Duplicate activity ${el.name !== fqn ? el.name + ' (' + fqn + ')' : el.name}`,
        {
          node: el,
          property: 'name',
          ...isAnotherDoc && {
            relatedInformation: [
              {
                location: {
                  range: (withSameFqn.nameSegment?.range ?? withSameFqn.selectionSegment?.range)!,
                  uri: withSameFqn.documentUri.toString(),
                },
                message: `conflicting activity`,
              },
            ],
          },
        },
      )
    }
  })
}

export const checkActivityStep = (services: LikeC4Services): ValidationCheck<ast.ActivityStep> => {
  const fqnIndex = services.likec4.FqnIndex
  const modelParser = services.likec4.ModelParser

  return tryOrLog((el, accept) => {
    const activityId = safeCall(() => fqnIndex.getFqn(el.$container.$container))
    if (!activityId) {
      accept('error', 'Source of activity step not resolved', {
        node: el,
      })
      return
    }
    const sourceFqn = elementFromActivityId(activityId)
    const parser = modelParser.forDocument(AstUtils.getDocument(el))
    const target = safeCall(() => parser.parseFqnRef(el.target))
    if (!target) {
      accept('error', 'Target not resolved', {
        node: el,
        property: 'target',
      })
      return
    }
    const targetFqn = FqnRef.toModelFqn(target)
    if (isSameHierarchy(sourceFqn, targetFqn)) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
        property: 'target',
      })
    }
  })
}
