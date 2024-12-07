import { DocumentState, type LangiumDocument, type MaybePromise } from 'langium'
import type { CodeLensProvider } from 'langium/lsp'
import type { CancellationToken, CodeLens, CodeLensParams } from 'vscode-languageserver'
import { isParsedLikeC4LangiumDocument, ViewOps } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'

export class LikeC4CodeLensProvider implements CodeLensProvider {
  constructor(private services: LikeC4Services) {
  }

  async provideCodeLens(
    doc: LangiumDocument,
    _params: CodeLensParams,
    cancelToken?: CancellationToken
  ): Promise<CodeLens[] | undefined> {
    if (doc.state !== DocumentState.Validated) {
      logger.debug(`Waiting for document ${doc.uri.path} to be validated`)
      await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Validated, doc.uri, cancelToken)
      logger.debug(`Document ${doc.uri.path} is validated`)
    }
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return
    }
    const views = doc.parseResult.value.views.flatMap(v => v.views)
    return views.flatMap<CodeLens>(ast => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewId = ViewOps.readId(ast)
      const range = ast.$cstNode?.range
      if (!range || !viewId) {
        return []
      }

      return {
        range: {
          start: range.start,
          end: {
            line: range.start.line,
            character: range.start.character + 4
          }
        },
        command: {
          command: 'likec4.open-preview',
          arguments: [viewId],
          title: 'open preview'
        }
      }
    })
  }
}
