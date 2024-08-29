import { type ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { RESERVED_WORDS } from './_shared'

export const viewChecks = (services: LikeC4Services): ValidationCheck<ast.LikeC4View> => {
  const index = services.shared.workspace.IndexManager
  return (el, accept) => {
    // const commentNode = CstUtils.findCommentNode(el.$cstNode, ['BLOCK_COMMENT'])
    // if (commentNode && hasManualLayout(commentNode.text) && !deserializeFromComment(commentNode.text)) {
    //   accept('warning', `Malformed @likec4-generated (ignored)`, {
    //     node: el,
    //     range: commentNode.range
    //   })
    // }
    if (!el.name) {
      return
    }
    if (RESERVED_WORDS.includes(el.name)) {
      accept('error', `Reserved word: ${el.name}`, {
        node: el,
        property: 'name'
      })
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
