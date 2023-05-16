import type { ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'

export const elementChecks = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  const fqnIndex = services.likec4.FqnIndex
  return (el, accept) => {
    const fqn = fqnIndex.get(el)
    if (!fqn) {
      accept('error', 'Not indexed', {
        node: el,
        property: 'name'
      })
      return
    }
    const withSameFqn = fqnIndex.byFqn(fqn).limit(2).count()
    if (withSameFqn > 1) {
      // console.error(withSameFqn.map(e => ({
      //   fqn,
      //   name: el.name,
      //   path: e.path,
      //   doc: e.doc.uri.toString()
      // })))
      accept(
        'error',
        `Duplicate element name ${el.name !== fqn ? el.name + ' (' + fqn + ')' : el.name}`,
        {
          node: el,
          property: 'name'
        }
      )
    }
  }
}
