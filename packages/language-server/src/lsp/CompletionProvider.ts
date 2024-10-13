import { type GrammarAST, type MaybePromise } from 'langium'
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionProviderOptions,
  DefaultCompletionProvider
} from 'langium/lsp'
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver-types'

export class LikeC4CompletionProvider extends DefaultCompletionProvider {
  override readonly completionOptions = {
    triggerCharacters: ['.']
  } satisfies CompletionProviderOptions

  protected override completionForKeyword(
    context: CompletionContext,
    keyword: GrammarAST.Keyword,
    acceptor: CompletionAcceptor
  ): MaybePromise<void> {
    if (!this.filterKeyword(context, keyword)) {
      return
    }
    if (['views', 'specification', 'model'].includes(keyword.value)) {
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert ${keyword.value} block`,
        kind: CompletionItemKind.Module,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: `${keyword.value} {\n\t$0\n}`
      })
    }
    if (keyword.value === 'dynamic') {
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert dynamic view`,
        kind: CompletionItemKind.Class,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: [
          'dynamic view ${1:view_${TM_FILENAME_BASE}_${CURRENT_SECOND}} {',
          '\ttitle \'${2:Untitled}\'',
          '\t',
          '\t$0',
          '}'
        ].join('\n')
      })
    }
    acceptor(context, {
      label: keyword.value,
      kind: this.getKeywordCompletionItemKind(keyword),
      detail: 'Keyword',
      sortText: '1'
    })
  }
}
