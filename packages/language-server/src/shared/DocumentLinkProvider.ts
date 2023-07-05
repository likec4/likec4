import type { LangiumDocument, LangiumSharedServices, MaybePromise, DocumentLinkProvider } from 'langium'
import { findNodeForProperty, streamAllContents } from 'langium/lib/utils'
import type { DocumentLink, DocumentLinkParams } from 'vscode-languageserver-protocol'
import { ast, isParsedLikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'

export class LikeC4DocumentLinkProvider implements DocumentLinkProvider {
  constructor(private services: LangiumSharedServices) {
    //
  }
  getDocumentLinks(
    doc: LangiumDocument,
    _params: DocumentLinkParams
  ): MaybePromise<DocumentLink[]> {
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return []
    }
    const base = new URL(doc.uri.toString())
    return streamAllContents(doc.parseResult.value)
      .filter(ast.isLinkProperty)
      .flatMap((n): DocumentLink | Iterable<DocumentLink> => {
        try {
          const u = new URL(n.value, base)
          const valueCst = findNodeForProperty(n.$cstNode, 'value')
          if (!valueCst) {
            return []
          }
          return {
            range: valueCst.range,
            target: u.toString()
          }
        } catch (e) {
          logger.error(e)
          return []
        }
      })
      .toArray()
  }
}
