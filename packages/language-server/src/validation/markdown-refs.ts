import { Fqn } from '@likec4/core/types'
import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { markdownRefsOf, projectIdFrom } from '../utils'
import { tryOrLog } from './_shared'

/**
 * Checks element and view refs (`[[cloud.api]]`, `[[view:index]]`) in Markdown values.
 * Broken refs are warnings, never errors: a broken link must not break the model.
 */
export const markdownRefsChecks = (services: LikeC4Services): ValidationCheck<ast.MarkdownOrString> => {
  const fqnIndex = services.likec4.FqnIndex
  const index = services.shared.workspace.IndexManager
  return tryOrLog((node, accept) => {
    const document = AstUtils.getDocument(node)
    const refs = markdownRefsOf(node, document)
    if (refs.length === 0) {
      return
    }
    const projectId = projectIdFrom(document)
    for (const { ref, targetRange, namespaceRange, range } of refs) {
      switch (ref.kind) {
        case 'element': {
          if (fqnIndex.byFqn(projectId, Fqn(ref.target)).isEmpty()) {
            accept('warning', `Element '${ref.target}' not found`, {
              node,
              range: targetRange,
            })
          }
          break
        }
        case 'view': {
          const exists = index
            .projectElements(projectId, ast.LikeC4View.$type)
            .some(desc => desc.name === ref.target)
          if (!exists) {
            accept('warning', `View '${ref.target}' not found`, {
              node,
              range: targetRange,
            })
          }
          break
        }
        case 'unknown': {
          accept('warning', `Unknown link namespace '${ref.namespace}'`, {
            node,
            range: namespaceRange ?? range,
          })
          break
        }
      }
    }
  })
}
