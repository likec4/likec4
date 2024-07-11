import { AstUtils, type ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'

const { getDocument } = AstUtils

export const elementChecks = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  const fqnIndex = services.likec4.FqnIndex
  const locator = services.workspace.AstNodeLocator
  return (el, accept) => {
    const fqn = fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Not indexed element', {
        node: el,
        property: 'name'
      })
      return
    }
    const doc = getDocument(el)
    const docUri = doc.uri
    const elPath = locator.getAstNodePath(el)
    const withSameFqn = fqnIndex
      .byFqn(fqn)
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
                  uri: withSameFqn.documentUri.toString()
                },
                message: `conflicting element`
              }
            ]
          }
        }
      )
    }
    // for (let i = 3; i < el.props.length; i++) {
    //   accept('error', `Too many properties, max 3 allowed`, {
    //     node: el,
    //     property: 'props',
    //     index: i
    //   })
    // }
  }
}
