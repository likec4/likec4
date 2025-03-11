import { type ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

export const viewChecks = (services: LikeC4Services): ValidationCheck<ast.LikeC4View> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    // const commentNode = CstUtils.findCommentNode(el.$cstNode, ['BLOCK_COMMENT'])
    // if (commentNode && hasManualLayout(commentNode.text) && !deserializeFromComment(commentNode.text)) {
    //   accept('warning', `Malformed @likec4-generated (ignored)`, {
    //     node: el,
    //     range: commentNode.range
    //   })
    // }
    if (!node.name) {
      return
    }
    if (RESERVED_WORDS.includes(node.name)) {
      accept('error', `Reserved word: ${node.name}`, {
        node: node,
        property: 'name',
      })
    }
    const projectId = projectIdFrom(node)
    const anotherViews = index
      .projectElements(projectId, ast.LikeC4View)
      .filter(n => n.name === node.name)
      .limit(2)
      .count()
    if (anotherViews > 1) {
      accept('error', `Duplicate view '${node.name}'`, {
        node: node,
        property: 'name',
      })
    }
  })
}
