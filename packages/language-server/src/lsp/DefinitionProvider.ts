import { Fqn } from '@likec4/core/types'
import {
  type AstNodeDescription,
  type AstNodeLocator,
  type LangiumDocument,
  type LangiumDocuments,
  type MaybePromise,
  CstUtils,
} from 'langium'
import { DefaultDefinitionProvider } from 'langium/lsp'
import type { CancellationToken, DefinitionParams } from 'vscode-languageserver'
import { LocationLink } from 'vscode-languageserver'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { type DocumentMarkdownRef, markdownRefsOf, projectIdFrom } from '../utils'

/**
 * Adds go to definition for element and view refs in Markdown values (`[[cloud.api]]`, `[[view:index]]`).
 * Everything else is handled by the default provider.
 */
export class LikeC4DefinitionProvider extends DefaultDefinitionProvider {
  protected readonly langiumDocuments: LangiumDocuments
  protected readonly astNodeLocator: AstNodeLocator

  constructor(protected services: LikeC4Services) {
    super(services)
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.astNodeLocator = services.workspace.AstNodeLocator
  }

  override getDefinition(
    document: LangiumDocument,
    params: DefinitionParams,
    cancelToken?: CancellationToken,
  ): MaybePromise<LocationLink[] | undefined> {
    const ref = this.findMarkdownRef(document, params)
    if (ref) {
      const links = this.markdownRefLinks(document, ref)
      return links.length > 0 ? links : undefined
    }
    return super.getDefinition(document, params, cancelToken)
  }

  /**
   * Finds the ref under the cursor, if the cursor is inside a Markdown string
   */
  protected findMarkdownRef(document: LangiumDocument, params: DefinitionParams): DocumentMarkdownRef | undefined {
    const root = document.parseResult.value.$cstNode
    if (!root) {
      return undefined
    }
    const offset = document.textDocument.offsetAt(params.position)
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset)
    if (!leaf || leaf.tokenType.name !== 'MarkdownString' || !ast.isMarkdownOrString(leaf.astNode)) {
      return undefined
    }
    return markdownRefsOf(leaf.astNode, document).find(r => r.offset.start <= offset && offset <= r.offset.end)
  }

  protected markdownRefLinks(document: LangiumDocument, { ref, targetRange }: DocumentMarkdownRef): LocationLink[] {
    const projectId = projectIdFrom(document)
    let targets: AstNodeDescription[]
    switch (ref.kind) {
      case 'element': {
        targets = this.services.likec4.FqnIndex.byFqn(projectId, Fqn(ref.target)).toArray()
        break
      }
      case 'view': {
        targets = this.services.shared.workspace.IndexManager
          .projectElements(projectId, ast.LikeC4View.$type)
          .filter(desc => desc.name === ref.target)
          .toArray()
        break
      }
      case 'unknown': {
        targets = []
        break
      }
    }
    return targets.flatMap(desc => {
      const selectionRange = desc.nameSegment?.range
      if (!selectionRange) {
        return []
      }
      // Full range of the target node, as the default provider does
      const targetDocument = this.langiumDocuments.getDocument(desc.documentUri)
      const node = desc.node
        ?? (targetDocument ? this.astNodeLocator.getAstNode(targetDocument.parseResult.value, desc.path) : undefined)
      const range = node?.$cstNode?.range ?? selectionRange
      return LocationLink.create(desc.documentUri.toString(), range, selectionRange, targetRange)
    })
  }
}
