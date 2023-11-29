import type { DocumentLinkProvider, LangiumDocument, MaybePromise } from 'langium'
import { findNodeForProperty, streamAllContents } from 'langium'
import { hasProtocol, isRelative, withBase } from 'ufo'
import type { DocumentLink, DocumentLinkParams } from 'vscode-languageserver-protocol'
import { ast, isParsedLikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentLinkProvider implements DocumentLinkProvider {
  constructor(private services: LikeC4Services) {
    //
  }
  getDocumentLinks(
    doc: LangiumDocument,
    _params: DocumentLinkParams
  ): MaybePromise<DocumentLink[]> {
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return []
    }
    return streamAllContents(doc.parseResult.value)
      .filter(ast.isLinkProperty)
      .flatMap((n): DocumentLink | Iterable<DocumentLink> => {
        try {
          const range = findNodeForProperty(n.$cstNode, 'value')?.range
          if (!range) {
            return []
          }
          const target = this.resolveLink(doc, n.value)
          return {
            range,
            target
          }
        } catch (e) {
          logError(e)
          return []
        }
      })
      .toArray()
  }

  resolveLink(doc: LangiumDocument, link: string): string {
    if (hasProtocol(link)) {
      return link
    }
    if (isRelative(link)) {
      const base = new URL(doc.uri.toString(true))
      return new URL(link, base).toString()
    }
    const workspace = this.services.shared.workspace.WorkspaceManager.workspaceURL
    return withBase(link, workspace.toString())
  }
}
