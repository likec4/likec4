import type { LangiumDocument } from 'langium'
import type { DocumentLinkProvider } from 'langium/lsp'
import type { LikeC4Services } from '../module'
import { isAnyOf } from '@likec4/core/utils'
import { AstUtils, GrammarUtils, interruptAndCheck } from 'langium'
import { UriUtils } from 'langium'
import {
  hasLeadingSlash,
  hasProtocol,
  isRelative,
  joinRelativeURL,
  withoutBase,
  withoutLeadingSlash,
} from 'ufo'
import { type DocumentLink, type DocumentLinkParams, CancellationToken } from 'vscode-languageserver'
import { ast, isLikeC4UserDocument, resolveDescriptionFile } from '../ast'
import { logWarnError } from '../logger'
import { documentSourceUri, isDependencyUri } from '../workspace/dependency-uri'

export class LikeC4DocumentLinkProvider implements DocumentLinkProvider {
  constructor(private services: LikeC4Services) {
    //
  }

  async getDocumentLinks(
    doc: LangiumDocument,
    _params: DocumentLinkParams,
    cancelToken: CancellationToken = CancellationToken.None,
  ): Promise<DocumentLink[]> {
    // Documents of external projects (`likec4-dep` scheme) are not validated, but their links are provided
    // (relative links resolve against the real file of a local dependency)
    if (
      !isLikeC4UserDocument(doc)
      || (!isDependencyUri(doc.uri) && this.services.shared.workspace.ProjectsLookup.isExcluded(doc))
    ) {
      return Promise.resolve([])
    }
    const links: DocumentLink[] = []
    for (
      const n of AstUtils.streamAllContents(doc.parseResult.value).filter(
        isAnyOf(ast.isLinkProperty, ast.isDescriptionFileProperty),
      )
    ) {
      try {
        const range = GrammarUtils.findNodeForProperty(n.$cstNode, 'value')?.range
        if (!range) {
          continue
        }
        const target = ast.isDescriptionFileProperty(n)
          ? resolveDescriptionFile(n, doc)?.toString()
          : this.resolveLink(doc, n.value)
        if (target && hasProtocol(target)) {
          links.push({
            range,
            target,
          })
        }
      } catch (e) {
        logWarnError(e)
      }
    }
    await interruptAndCheck(cancelToken)
    return links
  }

  resolveLink(doc: LangiumDocument, link: string): string {
    if (hasProtocol(link) || hasLeadingSlash(link)) {
      return link
    }
    if (isRelative(link)) {
      // Documents of local dependencies (likec4-dep scheme) resolve against their real file
      return joinRelativeURL(UriUtils.dirname(documentSourceUri(doc.uri)).toString(), link)
    }
    const base = this.services.shared.workspace.ProjectsLookup.getProject(doc).folderUri
    return joinRelativeURL(base.toString(), link)
  }

  relativeLink(doc: LangiumDocument, link: string): string | null {
    if (hasLeadingSlash(link)) {
      return withoutLeadingSlash(link)
    }
    if (isRelative(link)) {
      const base = this.services.shared.workspace.ProjectsLookup.getProject(doc).folderUri.toString()
      const docURL = new URL(documentSourceUri(doc.uri).toString())
      const linkURL = new URL(link, docURL).toString()
      return withoutLeadingSlash(
        withoutBase(linkURL, base),
      )
    }
    return null
  }
}
