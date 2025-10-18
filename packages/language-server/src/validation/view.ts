import { type ValidationCheck, CstUtils } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { hasManualLayout } from '../view-utils/manual-layout'
import { RESERVED_WORDS, tryOrLog } from './_shared'

export const viewChecks = (services: LikeC4Services): ValidationCheck<ast.LikeC4View> => {
  const index = services.shared.workspace.IndexManager
  return tryOrLog((el, accept) => {
    const commentNode = CstUtils.findCommentNode(el.$cstNode, ['BLOCK_COMMENT'])
    if (commentNode && hasManualLayout(commentNode.text)) {
      accept('warning', `Migrate to the new manual layout snapshots (run LikeC4: Migrate manual layouts)`, {
        node: el,
        range: commentNode.range,
        code: 'manual-layout-v1',
        // codeDescription: {
        //   href: 'https://likec4.dev/docs/guides/manual-layout#migrating-from-v1-to-v2-manual-layout',
        // },
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
