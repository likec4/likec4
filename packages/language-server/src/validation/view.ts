import type { ValidationCheck } from 'langium'
import { CstUtils } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const LIKEC4_GENERATED_RE = /@likec4-generated/

export const viewChecks = (services: LikeC4Services): ValidationCheck<ast.LikeC4View> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((el, accept) => {
    const commentNode = CstUtils.findCommentNode(el.$cstNode, ['BLOCK_COMMENT'])
    if (commentNode && LIKEC4_GENERATED_RE.test(commentNode.text)) {
      accept('warning', `ManualLayoutV1 is no longer supported; remove this block`, {
        node: el,
        range: commentNode.range,
      })
    }
    if (!el.name) {
      return
    }
    if (RESERVED_WORDS.includes(el.name)) {
      accept('error', `Reserved word: ${el.name}`, {
        node: el,
        property: 'name',
      })
    }
    const projectId = projectIdFrom(el)
    const anotherViews = index
      .projectElements(projectId, ast.LikeC4View)
      .filter(n => n.name === el.name)
      .limit(2)
      .count()
    if (anotherViews > 1) {
      accept('error', `Duplicate view '${el.name}'`, {
        node: el,
        property: 'name',
      })
    }
  })
}
