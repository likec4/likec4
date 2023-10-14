import type { DocumentLinkProvider, LangiumDocument, MaybePromise } from 'langium'
import { findNodeForProperty, streamAllContents } from 'langium'
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
          logError(e)
          return []
        }
      })
      .toArray()
  }
}
