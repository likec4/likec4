import type { LangiumDocument } from 'langium'
import { AstUtils, GrammarUtils } from 'langium'
import type { DocumentLinkProvider } from 'langium/lsp'
import { hasLeadingSlash, hasProtocol, isRelative, withoutBase, withoutLeadingSlash } from 'ufo'
import type { CancellationToken, DocumentLink, DocumentLinkParams } from 'vscode-languageserver'
import { ast, isLikeC4LangiumDocument } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentLinkProvider implements DocumentLinkProvider {
  constructor(private services: LikeC4Services) {
    //
  }

  async getDocumentLinks(
    doc: LangiumDocument,
    _params: DocumentLinkParams,
    cancelToken?: CancellationToken,
  ): Promise<DocumentLink[]> {
    if (!isLikeC4LangiumDocument(doc)) {
      return []
    }
    return AstUtils.streamAllContents(doc.parseResult.value)
      .filter(ast.isLinkProperty)
      .map((n): DocumentLink | null => {
        try {
          const range = GrammarUtils.findNodeForProperty(n.$cstNode, 'value')?.range
          const target = range && this.resolveLink(doc, n.value)
          if (target && hasProtocol(target)) {
            return {
              range,
              target,
            }
          }
        } catch (e) {
          logWarnError(e)
        }
        return null
      })
      .nonNullable()
      .toArray()
  }

  resolveLink(doc: LangiumDocument, link: string): string {
    if (hasProtocol(link) || hasLeadingSlash(link)) {
      return link
    }
    const base = isRelative(link)
      ? new URL(doc.uri.toString(true))
      : this.services.shared.workspace.WorkspaceManager.workspaceURL
    return new URL(link, base).toString()
  }

  relativeLink(doc: LangiumDocument, link: string): string | null {
    if (hasLeadingSlash(link)) {
      return withoutLeadingSlash(link)
    }
    if (isRelative(link)) {
      const base = new URL(doc.uri.toString(true))
      const linkURL = new URL(link, base).toString()
      return withoutLeadingSlash(
        withoutBase(linkURL, this.services.shared.workspace.WorkspaceManager.workspaceURL.toString()),
      )
    }
    return null
  }
}
