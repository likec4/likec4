import { ThemeColors } from '@likec4/core/styles'
import { type MaybePromise, AstUtils, GrammarAST } from 'langium'
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionProviderOptions,
  type NextFeature,
  DefaultCompletionProvider,
} from 'langium/lsp'
import { anyPass, isEmpty } from 'remeda'
import { CompletionItemKind, InsertTextFormat, TextEdit } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

const STYLE_FIELDS = [
  'color',
  'shape',
  'icon',
  'iconColor',
  'iconSize',
  'iconPosition',
  'border',
  'opacity',
  'multiple',
  'size',
  'textSize',
].join(',')

function isCompletionForPojectName(
  context: CompletionContext,
  next: NextFeature,
): next is NextFeature<GrammarAST.RuleCall> {
  return GrammarAST.isRuleCall(next.feature)
    && next.property === 'project'
    && ast.isImportsFromPoject(context.node)
}

export class LikeC4CompletionProvider extends DefaultCompletionProvider {
  constructor(protected services: LikeC4Services) {
    super(services)
  }

  override readonly completionOptions = {
    triggerCharacters: ['.', '#'],
  } satisfies CompletionProviderOptions

  protected override completionFor(
    context: CompletionContext,
    next: NextFeature,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    switch (true) {
      case GrammarAST.isKeyword(next.feature):
        return this.completionForKeyword(context, next.feature, acceptor)

      case GrammarAST.isCrossReference(next.feature) && !!context.node:
        return this.completionForCrossReference(context, next as NextFeature<GrammarAST.CrossReference>, acceptor)

      case isCompletionForPojectName(context, next):
        return this.completionForImportedProject(context, acceptor)
    }
  }

  protected override completionForKeyword(
    context: CompletionContext,
    keyword: GrammarAST.Keyword,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    if (!this.filterKeyword(context, keyword)) {
      return
    }
    switch (true) {
      case keyword.value === 'import':
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Snippet,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} { $0 } from '\${1|${
            this.services.shared.workspace.ProjectsManager.all.join(',')
          }|}'`,
        })
        break
      case keyword.value === 'deployment' && AstUtils.hasContainerOfType(context.node, ast.isModelViews):
        acceptor(context, {
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
        break
      case ['title', 'description', 'technology', 'link'].includes(keyword.value):
        acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} property`,
          kind: CompletionItemKind.Property,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} '\${0}'`,
        })
        break
      case keyword.value === 'color':
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Property,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${1|${ThemeColors.join(',')}|}$0`,
        })
        break
      case keyword.value === 'opacity':
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Property,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${0:100}%`,
        })
        break
      case ['views', 'specification', 'model', 'deployment', 'with'].includes(keyword.value):
        acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} {\n\t$0\n}`,
        })
        break
      case keyword.value === 'group':
        acceptor(context, {
          label: keyword.value,
          detail: `Insert group block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: [
            'group \'${1:Title}\' {',
            '\t$0',
            '}',
          ].join('\n'),
        })
        break
      case ['par', 'parallel'].includes(keyword.value):
        acceptor(context, {
          label: keyword.value,
          detail: `Insert block of parallel steps`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: [
            `${keyword.value} {`,
            '\t$0',
            '}',
          ].join('\n'),
        })
        break
      case keyword.value === 'dynamic' && AstUtils.hasContainerOfType(context.node, ast.isModelViews):
        acceptor(context, {
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
        break
      case keyword.value === 'style' && context.node && AstUtils.hasContainerOfType(context.node, ast.isGlobalStyle):
        acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${1:name} \${2:*} {\n\t\${3|${STYLE_FIELDS}|} $0\n}`,
        })
        break
      case keyword.value === 'style' && context.node &&
        AstUtils.hasContainerOfType(context.node, anyPass([ast.isModelViews, ast.isGlobalStyleGroup])):
        acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} \${1:*} {\n\t\${2|${STYLE_FIELDS}|} $0\n}`,
        })
        break
      case keyword.value === 'style':
        acceptor(context, {
          label: keyword.value,
          detail: `Insert ${keyword.value} block`,
          kind: CompletionItemKind.Module,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: `${keyword.value} {\n\t\${1|${STYLE_FIELDS}|} $0\n}`,
        })
        break
      case keyword.value === 'extend':
        acceptor(context, {
          label: keyword.value,
          detail: `Extend another view`,
          kind: CompletionItemKind.Class,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: 'extend $1 {\n\t$0\n}',
        })
        break
      case keyword.value === 'autoLayout':
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Property,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: 'autoLayout ${1|TopBottom,BottomTop,LeftRight,RightLeft|}$0',
        })
        break
      case keyword.value === 'mode':
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Property,
          insertTextFormat: InsertTextFormat.Snippet,
          insertText: 'mode ${1|sequence,diagram|}$0',
        })
        break
      case ['include', 'exclude'].includes(keyword.value):
        acceptor(context, {
          label: keyword.value,
          kind: CompletionItemKind.Operator,
          detail: `Insert ${keyword.value} predicate`,
          insertTextFormat: InsertTextFormat.PlainText,
          insertText: `${keyword.value} `,
        })
        break
      default:
        acceptor(context, {
          label: keyword.value,
          kind: this.getKeywordCompletionItemKind(keyword),
          detail: 'Keyword',
          sortText: '1',
        })
    }
  }

  protected completionForImportedProject(
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ) {
    const projectsManager = this.services.shared.workspace.ProjectsManager
    const txtDoc = context.document.textDocument
    const range = {
      start: txtDoc.positionAt(context.tokenOffset),
      end: txtDoc.positionAt(context.tokenEndOffset),
    }
    const txt = txtDoc.getText(range)
    // What is the current character used for quoting
    const currentQuote = isEmpty(txt) ? `'` : txt.substring(0, 1)

    for (const projectId of projectsManager.all) {
      const insertText = currentQuote + projectId + currentQuote
      acceptor(context, {
        label: projectId,
        kind: CompletionItemKind.Folder,
        insertText,
        filterText: insertText,
        textEdit: TextEdit.replace(range, insertText),
        detail: 'Project',
        sortText: '0_' + projectId,
      })
    }
  }
}
