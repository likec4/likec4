import { type GrammarAST, type MaybePromise, AstUtils } from 'langium'
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionProviderOptions,
  DefaultCompletionProvider,
} from 'langium/lsp'
import { anyPass } from 'remeda'
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver-types'
import { ast } from '../ast'

const STYLE_FIELDS = [
  'color',
  'shape',
  'icon',
  'border',
  'opacity',
  'multiple',
].join(',')

export class LikeC4CompletionProvider extends DefaultCompletionProvider {
  override readonly completionOptions = {
    triggerCharacters: ['.'],
  } satisfies CompletionProviderOptions

  protected override completionForKeyword(
    context: CompletionContext,
    keyword: GrammarAST.Keyword,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    if (!this.filterKeyword(context, keyword)) {
      return
    }
    if (keyword.value === 'deployment' && AstUtils.hasContainerOfType(context.node, ast.isModelViews)) {
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert deployment view`,
        kind: CompletionItemKind.Class,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: [
          'deployment view ${1:view_${TM_FILENAME_BASE}_${CURRENT_SECOND}} {',
          '\ttitle \'${2:Untitled}\'',
          '\t',
          '\tinclude $0',
          '}',
        ].join('\n'),
      })
    }
    if (['title', 'description', 'technology'].includes(keyword.value)) {
      return acceptor(context, {
        label: keyword.value,
        kind: CompletionItemKind.Property,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: `${keyword.value} '\${0}'`,
      })
    }
    if (['views', 'specification', 'model', 'deployment', 'with'].includes(keyword.value)) {
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert ${keyword.value} block`,
        kind: CompletionItemKind.Module,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: `${keyword.value} {\n\t$0\n}`,
      })
    }
    if (keyword.value === 'group') {
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert group block`,
        kind: CompletionItemKind.Class,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: [
          'group \'${1:Title}\' {',
          '\t$0',
          '}',
        ].join('\n'),
      })
    }
    if (keyword.value === 'dynamic' && AstUtils.hasContainerOfType(context.node, ast.isModelViews)) {
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
          '}',
        ].join('\n'),
      })
    }
    if (keyword.value === 'style' && context.node) {
      if (AstUtils.hasContainerOfType(context.node, ast.isGlobalStyle)) {
        return acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${1:name} \${2:*} {\n\t\${3|${STYLE_FIELDS}|} $0\n}`,
        })
      }
      if (AstUtils.hasContainerOfType(context.node, anyPass([ast.isModelViews, ast.isGlobalStyleGroup]))) {
        return acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${1:*} {\n\t\${2|${STYLE_FIELDS}|} $0\n}`,
        })
      }
      return acceptor(context, {
        label: keyword.value,
        detail: `Insert ${keyword.value} block`,
        kind: CompletionItemKind.Module,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: `${keyword.value} {\n\t\${1|${STYLE_FIELDS}|} $0\n}`,
      })
    }
    if (keyword.value === 'extend') {
      return acceptor(context, {
        label: keyword.value,
        detail: `Extend another view`,
        kind: CompletionItemKind.Class,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: 'extend ${1:element} {\n\t$0\n}',
      })
    }

    if (keyword.value === 'autoLayout') {
      return acceptor(context, {
        label: keyword.value,
        kind: CompletionItemKind.Class,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: 'autoLayout ${1|TopBottom,BottomTop,LeftRight,RightLeft|}$0',
      })
    }
    acceptor(context, {
      label: keyword.value,
      kind: this.getKeywordCompletionItemKind(keyword),
      detail: 'Keyword',
      sortText: '1',
    })
  }
}
