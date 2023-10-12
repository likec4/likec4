import { getDocument, type ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'

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
      accept(
        'error',
        `Duplicate element name ${el.name !== fqn ? el.name + ' (' + fqn + ')' : el.name}`,
        {
          node: el,
          property: 'name',
          relatedInformation: [
            {
              location: {
                range: withSameFqn.el.$cstNode!.range,
                uri: getDocument(withSameFqn.el).uri.toString()
              },
              message: `Already defined here`
            }
          ]
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
