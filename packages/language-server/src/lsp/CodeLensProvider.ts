import type { CodeLensProvider, LangiumDocument, MaybePromise } from 'langium'
import type { CancellationToken, CodeLens, CodeLensParams } from 'vscode-languageserver'
import { ElementViewOps, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { first } from 'remeda'

export class LikeC4CodeLensProvider implements CodeLensProvider {
  constructor(private services: LikeC4Services) {
    //
  }

  provideCodeLens(
    doc: LangiumDocument,
    _params: CodeLensParams,
    _cancelToken?: CancellationToken
  ): MaybePromise<CodeLens[] | undefined> {
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return
    }
    const views = first(doc.parseResult.value.views)
    return views?.views.flatMap<CodeLens>(ast => {
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
          title: 'open preview'
        }
      }
    })
  }
}
