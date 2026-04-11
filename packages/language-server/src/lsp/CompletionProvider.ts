import { BorderStyles, ElementShapes, Sizes, ThemeColors } from '@likec4/core/styles'
import { type MaybePromise, AstUtils, GrammarAST } from 'langium'
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionProviderOptions,
  type NextFeature,
  DefaultCompletionProvider,
} from 'langium/lsp'
import { anyPass, isEmpty } from 'remeda'
import type { SetRequired } from 'type-fest'
import { CompletionItem, CompletionItemKind, InsertTextFormat, TextEdit } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

function isCompletionForPojectName(
  context: CompletionContext,
  next: NextFeature,
): next is NextFeature<GrammarAST.RuleCall> {
  return GrammarAST.isRuleCall(next.feature)
    && next.property === 'project'
    && ast.isImportsFromPoject(context.node)
}

const viewSnippet = `view_\${CURRENT_MINUTE}_\${CURRENT_SECOND} {
\ttitle 'Untitled'
\t
\tinclude \${0:*}
}`

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

    const acceptProperty = (insertAfterText: string) => {
      acceptor(context, {
        label: keyword.value,
        detail: `Insert ${keyword.value} property`,
        kind: CompletionItemKind.Property,
        insertTextFormat: InsertTextFormat.Snippet,
        insertText: `${keyword.value} ${insertAfterText}`,
      })
    }

    const acceptSnippet = ({ insertText, ...item }: SetRequired<Partial<CompletionItem>, 'insertText'>) => {
      acceptor(context, {
        label: keyword.value,
        detail: `Insert ${keyword.value}`,
        kind: CompletionItemKind.Snippet,
        insertTextFormat: InsertTextFormat.Snippet,
        ...item,
        insertText: `${keyword.value} ${insertText}`,
      })
    }

    const acceptPropertyAndSuggest = (variants: readonly string[]) => {
      acceptProperty(`\${1|${variants.join(',')}|}$0`)
    }

    switch (true) {
      case 'import' === keyword.value:
        acceptSnippet({
          insertText: `{ $0 } from '\${1|${this.services.shared.workspace.ProjectsManager.all.join(',')}|}'`,
        })
        break
      case 'deployment' === keyword.value && AstUtils.hasContainerOfType(context.node, ast.isModelViews):
        acceptSnippet({
          detail: `Insert deployment view`,
          kind: CompletionItemKind.Class,
          insertText: `view ${viewSnippet}`,
        })
        break
      case 'dynamic' === keyword.value && AstUtils.hasContainerOfType(context.node, ast.isModelViews):
        acceptSnippet({
          detail: `Insert dynamic view`,
          kind: CompletionItemKind.Class,
          insertText: [
            'view view_${CURRENT_MINUTE}_${CURRENT_SECOND} {',
            `\ttitle 'Untitled'`,
            '\t',
            '\t$0',
            '}',
          ].join('\n'),
        })
        break
      case 'view' === keyword.value && AstUtils.hasContainerOfType(context.node, ast.isModelViews):
        acceptSnippet({
          detail: `Insert element view`,
          kind: CompletionItemKind.Class,
          insertText: viewSnippet,
        })
        break
      case 'opacity' === keyword.value:
        acceptPropertyAndSuggest(['0%', '20%', '60%', '100%'])
        break
      case 'shape' === keyword.value:
        acceptPropertyAndSuggest(ElementShapes)
        break
      case ['color', 'iconColor'].includes(keyword.value):
        acceptPropertyAndSuggest(ThemeColors)
        break
      case ['size', 'textSize', 'padding'].includes(keyword.value):
        acceptPropertyAndSuggest(Sizes)
        break
      case 'border' === keyword.value:
        acceptPropertyAndSuggest(BorderStyles)
        break
      case 'autoLayout' === keyword.value:
        acceptPropertyAndSuggest(['TopBottom', 'BottomTop', 'LeftRight', 'RightLeft'])
        break
      case ['title', 'description', 'technology', 'summary', 'notes', 'notation'].includes(keyword.value):
        acceptProperty(`'$0'`)
        break
      case 'metadata' === keyword.value:
        acceptProperty('{\n\t$0\n}')
        break
      case ['views', 'specification', 'model', 'deployment', 'with'].includes(keyword.value):
        acceptSnippet({
          kind: CompletionItemKind.Module,
          insertText: `{\n\t$0\n}`,
        })
        break
      case 'group' === keyword.value:
        acceptSnippet({
          kind: CompletionItemKind.Module,
          insertText: '\'${1:Title}\' {\n\t$0\n}',
        })
        break
      case ['par', 'parallel'].includes(keyword.value):
        acceptSnippet({
          detail: `Insert parallel steps`,
          kind: CompletionItemKind.Module,
          insertText: `{\n\t$0\n}`,
        })
        break
      case 'style' === keyword.value && context.node && AstUtils.hasContainerOfType(context.node, ast.isGlobalStyle):
        acceptSnippet({
          kind: CompletionItemKind.Module,
          insertText: '${1:name} ${2:*} {\n\t$0\n}',
        })
        break
      case 'style' === keyword.value && context.node &&
        AstUtils.hasContainerOfType(context.node, anyPass([ast.isModelViews, ast.isGlobalStyleGroup])):
        acceptSnippet({
          kind: CompletionItemKind.Module,
          insertText: '${1:*} {\n\t$0\n}',
        })
        break
      case 'style' === keyword.value:
        acceptSnippet({
          kind: CompletionItemKind.Module,
          insertText: '{\n\t$0\n}',
        })
        break
      case 'extend' === keyword.value:
        acceptSnippet({
          detail: `Extend another view`,
          kind: CompletionItemKind.Class,
          insertText: '$1 {\n\t$0\n}',
        })
        break
      case 'mode' === keyword.value:
        acceptPropertyAndSuggest(['sequence', 'diagram'])
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
