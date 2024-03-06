import { AstUtils, type ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'

const { getDocument } = AstUtils

export const elementChecks = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    const fqn = fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Not indexed element', {
        node: el,
        property: 'name'
      })
      return
    }
    const withSameFqn = fqnIndex
      .byFqn(fqn)
      .filter(v => v.el !== el)
      .head()
    if (withSameFqn) {
      const isAnotherDoc = withSameFqn.doc.uri !== getDocument(el).uri
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
                  range: withSameFqn.el.$cstNode!.range,
                  uri: withSameFqn.doc.uri.toString()
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
