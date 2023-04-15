import type { LangiumDocument, LangiumSharedServices, MaybePromise } from 'langium'
import type { CodeLensProvider } from 'langium/lib/lsp/code-lens-provider'
import type { CancellationToken, CodeLens, CodeLensParams } from 'vscode-languageserver-protocol'
import { ElementViewOps, isParsedLikeC4LangiumDocument } from '../ast'


export class LikeC4CodeLensProvider implements CodeLensProvider {

  constructor(private services: LangiumSharedServices) {
    //
  }

  provideCodeLens(doc: LangiumDocument, _params: CodeLensParams, _cancelToken?: CancellationToken): MaybePromise<CodeLens[] | undefined> {
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return
    }

    return doc.parseResult.value.views?.views.flatMap<CodeLens>((ast) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewId = ElementViewOps.readId(ast)
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
          title: 'open preview',
        }
      }
    })
  }

}
