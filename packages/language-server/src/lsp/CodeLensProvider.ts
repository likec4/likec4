import { type LangiumDocument, interruptAndCheck } from 'langium'
import type { CodeLensProvider } from 'langium/lsp'
import type { CancellationToken, CodeLens, CodeLensParams } from 'vscode-languageserver'
import { isLikeC4LangiumDocument, ViewOps } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'

export class LikeC4CodeLensProvider implements CodeLensProvider {
  constructor(private services: LikeC4Services) {
  }

  async provideCodeLens(
    doc: LangiumDocument,
    _params: CodeLensParams,
    cancelToken?: CancellationToken,
  ): Promise<CodeLens[] | undefined> {
    if (!isLikeC4LangiumDocument(doc)) {
      return
    }
    const views = doc.parseResult.value.views.flatMap(v => v.views)
    if (views.length === 0) {
      return []
    }
    if (cancelToken) {
      await interruptAndCheck(cancelToken)
    }
    return views.flatMap<CodeLens>(ast => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewId = ViewOps.readId(ast)
      const range = ast.$cstNode?.range
      if (!range || !viewId) {
        return []
      }
      const projectId = projectIdFrom(ast)
      const lensRange = {
        start: range.start,
        end: {
          line: range.start.line,
          character: range.start.character + 4,
        },
      }

      // Client commands — executed by the VS Code extension, not the language server.
      return [
        {
          range: lensRange,
          command: {
            command: 'likec4.open-preview',
            arguments: [viewId, projectId],
            title: 'open preview',
          },
        },
        {
          range: lensRange,
          command: {
            command: 'likec4.save-as-png',
            arguments: [viewId, projectId],
            title: 'save png',
          },
        },
      ]
    })
  }
}
