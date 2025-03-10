import { type ValidationCheck, AstUtils } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const elementChecks = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  const fqnIndex = services.likec4.FqnIndex
  const locator = services.workspace.AstNodeLocator
  return tryOrLog((el, accept) => {
    const fqn = fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Not indexed element', {
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
        `Duplicate element name ${el.name !== fqn ? el.name + ' (' + fqn + ')' : el.name}`,
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
                message: `conflicting element`,
              },
            ],
          },
        },
      )
    }
  })
}
