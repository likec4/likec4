import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

export const viewChecks = (services: LikeC4Services): ValidationCheck<ast.LikeC4View> => {
  const index = services.shared.workspace.IndexManager
  return (el, accept) => {
    // if (el.extends) {
    //   // TODO: circular dependency check
    // }
    if (!el.name) {
      return
    }
    const anotherViews = index
      .allElements(ast.LikeC4View)
      .filter(n => n.name === el.name)
      .limit(2)
      .count()
    if (anotherViews > 1) {
      accept('error', `Duplicate view '${el.name}'`, {
        node: el,
        property: 'name'
      })
    }
  }
}
