import { BorderStyles, ElementShapes, Sizes, Sizings, ThemeColors } from '@likec4/core/styles'
import type { ProjectId } from '@likec4/core/types'
import {
  type AstNodeDescription,
  type LangiumDocument,
  type MaybePromise,
  AstUtils,
  CstUtils,
  GrammarAST,
} from 'langium'
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionProviderOptions,
  type NextFeature,
  DefaultCompletionProvider,
} from 'langium/lsp'
import { anyPass, isEmpty } from 'remeda'
import type { SetRequired } from 'type-fest'
import { type CancellationToken, type CompletionParams, CompletionTriggerKind } from 'vscode-languageserver-protocol'
import {
  type Position,
  type Range,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  InsertReplaceEdit,
  InsertTextFormat,
  TextEdit,
} from 'vscode-languageserver-types'
import { ast } from '../ast'
import { toSingleLine } from '../model/parser/Base'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'

function isCompletionForPojectName(
  context: CompletionContext,
  next: NextFeature,
): next is NextFeature<GrammarAST.RuleCall> {
  return GrammarAST.isRuleCall(next.feature)
    && next.property === 'project'
    && ast.isImportsFromPoject(context.node)
}

/**
 * Trigger characters that are only meaningful for element links in Markdown (`[[fqn]]`, `[[view:id]]`).
 * When completion is triggered by one of them outside of a link context, nothing is offered,
 * so typing `[` or `:` elsewhere in the DSL does not open the suggest widget.
 */
const MarkdownRefTriggerCharacters = ['[', ':']

/**
 * Unclosed `[[` followed by FQN-ish characters (and an optional `namespace:`) up to the end of the text.
 * Works on the raw token text: DSL strings are unescaped before Markdown, so `\[[` is still a ref
 * (the DSL drops the backslash), and the Markdown-escaped literal `[[` is written `\\[[`, which is ignored.
 */
const UnclosedRefRegex = /(?<!\\\\)\[\[([\w.:-]*)$/

/**
 * Rest of the ref target after the cursor: up to the first whitespace, `|`, `\|`, `]]` (or `[`).
 * Same characters as a target in `extractRefs` (`@likec4/core/utils`).
 */
const TargetRestRegex = /^[^\s[\]|\\]*/
const ClosedRefRestRegex = /^(?:\]\]|\\*\|)/

const ViewNamespace = 'view:'

/**
 * Element link being typed under the cursor inside a Markdown string
 */
type MarkdownRefContext = {
  /**
   * `element` - after `[[`, `view` - after `[[view:`
   */
  kind: 'element' | 'view'
  /**
   * Text typed between `[[` (or `[[view:`) and the cursor
   */
  typed: string
  /**
   * Range from right after `[[` (or `[[view:`) to the cursor
   */
  range: Range
  /**
   * Range from right after `[[` to the cursor (replaced by the `view:` item)
   */
  refRange: Range
  /**
   * End of the rest of the target after the cursor.
   * Both ranges above, extended to this position, are the replace ranges
   * (e.g. completing in `[[clo|ud]]` can replace `ud`).
   */
  replaceEnd: Position
  /**
   * Whether the closing `]]` must be inserted
   */
  needsClosing: boolean
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
    triggerCharacters: ['.', '#', ...MarkdownRefTriggerCharacters],
    allCommitCharacters: [' ', '\t', '\n'],
  } satisfies CompletionProviderOptions

  override async getCompletion(
    document: LangiumDocument,
    params: CompletionParams,
    cancelToken?: CancellationToken,
  ): Promise<CompletionList | undefined> {
    const markdown = this.findMarkdownRefContext(document, params)
    if (markdown !== undefined) {
      // Inside a Markdown string only element links are completed, no keywords or other noise
      if (markdown === null) {
        return CompletionList.create([], false)
      }
      return this.completionForMarkdownRef(projectIdFrom(document), markdown)
    }
    if (
      params.context?.triggerKind === CompletionTriggerKind.TriggerCharacter
      && MarkdownRefTriggerCharacters.includes(params.context.triggerCharacter ?? '')
    ) {
      return CompletionList.create([], false)
    }
    return super.getCompletion(document, params, cancelToken)
  }

  /**
   * Detects an element link being typed under the cursor.
   * Langium computes completion at the start of the token when the cursor is inside it,
   * so for Markdown strings this works on the raw text of the token.
   *
   * @returns `undefined` if the cursor is not inside a Markdown string (`'''…'''` or `"""…"""`),
   *          `null` if it is inside a Markdown string, but not in an unclosed `[[` link,
   *          otherwise the link context.
   */
  protected findMarkdownRefContext(
    document: LangiumDocument,
    params: CompletionParams,
  ): MarkdownRefContext | null | undefined {
    const root = document.parseResult.value.$cstNode
    if (!root) {
      return undefined
    }
    const textDocument = document.textDocument
    const offset = textDocument.offsetAt(params.position)
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset)
    if (!leaf || leaf.tokenType.name !== 'MarkdownString') {
      return undefined
    }
    const token = leaf.text
    // Both ''' and """ are 3 characters
    const quoteLength = 3
    const cursor = offset - leaf.offset
    // Cursor is on the quotes
    if (cursor < quoteLength || cursor > token.length - quoteLength) {
      return undefined
    }
    const before = token.slice(quoteLength, cursor)
    const lineStart = before.lastIndexOf('\n') + 1
    const line = before.slice(lineStart)
    const match = UnclosedRefRegex.exec(line)
    if (!match || isInsideCode(before.slice(0, lineStart), line.slice(0, match.index))) {
      return null
    }
    const after = token.slice(cursor, token.length - quoteLength)
    const rest = TargetRestRegex.exec(after)?.[0] ?? ''
    // Checked after the rest of the target, so `]]` is not duplicated in the replace mode.
    // A label separator (`|` or `\|`) there means the ref is already closed further on
    const needsClosing = !ClosedRefRestRegex.test(after.slice(rest.length))
    const replaceEnd = textDocument.positionAt(offset + rest.length)

    const refText = match[1] ?? ''
    const refStart = offset - refText.length
    const refRange = {
      start: textDocument.positionAt(refStart),
      end: params.position,
    }
    switch (true) {
      case refText.startsWith(ViewNamespace):
        return {
          kind: 'view',
          typed: refText.slice(ViewNamespace.length),
          range: {
            start: textDocument.positionAt(refStart + ViewNamespace.length),
            end: params.position,
          },
          refRange,
          replaceEnd,
          needsClosing,
        }
      // Unknown namespace, nothing to suggest
      case refText.includes(':'):
        return null
      default:
        return {
          kind: 'element',
          typed: refText,
          range: refRange,
          refRange,
          replaceEnd,
          needsClosing,
        }
    }
  }

  /**
   * Completion for element links in Markdown strings.
   *
   * Filtering: the server keeps candidates that contain the typed text as a case-insensitive substring
   * of the whole FQN (or view id).
   * VSCode then filters on the client: it fuzzy-matches the text between `textEdit.range.start` and
   * the cursor against `filterText` (or `label` if absent). With the default
   * `editor.suggest.matchOnWordStartOnly: true` (`firstMatchCanBeWeak: false` in the fuzzy scorer),
   * the first typed character must match at a word start (start of the text or after a separator like `.`),
   * so a match in the middle of a segment (`kend` in `cloud.backend.api`) would be dropped.
   * That is why `filterText` is the FQN starting from the substring match: it always starts with the typed text.
   * The list is marked incomplete, so the client asks again on every keystroke and gets fresh `filterText`.
   */
  protected completionForMarkdownRef(projectId: ProjectId, ref: MarkdownRefContext): CompletionList {
    const closing = ref.needsClosing ? ']]' : ''
    const typed = ref.typed.toLowerCase()
    const items = [] as CompletionItem[]
    const seen = new Set<string>()
    let rank = 0

    const accept = (desc: AstNodeDescription, key: string, detail: string | undefined) => {
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      const matchAt = key.toLowerCase().indexOf(typed)
      if (matchAt < 0) {
        return
      }
      // Matches at the start first, then at the start of a segment, then the rest; keeping the index order
      const matchRank = matchAt === 0 ? 0 : key[matchAt - 1] === '.' ? 1 : 2
      items.push({
        label: key,
        kind: this.nodeKindProvider.getCompletionItemKind(desc),
        ...(detail && { detail }),
        filterText: key.slice(matchAt),
        sortText: `${matchRank}_${String(rank++).padStart(6, '0')}`,
        textEdit: insertReplaceEdit(key + closing, ref.range, ref.replaceEnd),
        // Do not commit on space: it is regular text inside Markdown
        commitCharacters: [],
      })
    }

    if (ref.kind === 'view') {
      const views = this.services.shared.workspace.IndexManager.projectElements(projectId, ast.LikeC4View.$type)
      for (const desc of views) {
        accept(desc, desc.name, viewDetail(desc))
      }
      return CompletionList.create(items, true)
    }

    for (const desc of this.services.likec4.FqnIndex.elements(projectId)) {
      accept(desc, desc.id, elementDetail(desc))
    }

    if (ViewNamespace.startsWith(typed)) {
      items.push({
        label: ViewNamespace,
        kind: CompletionItemKind.Keyword,
        detail: 'Link to a view',
        filterText: ViewNamespace,
        sortText: '9_',
        textEdit: insertReplaceEdit(ViewNamespace, ref.refRange, ref.replaceEnd),
        commitCharacters: [],
        command: {
          title: 'Suggest views',
          command: 'editor.action.triggerSuggest',
        },
      })
    }

    return CompletionList.create(items, true)
  }

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

    /**
     * The generated text starts with the keyword itself, so it must replace the
     * already typed prefix. We provide an explicit `textEdit` instead of `insertText`,
     * because clients that apply `insertText` at the cursor would duplicate the
     * keyword (see https://github.com/likec4/likec4/issues/3091)
     */
    const acceptReplacing = (item: Partial<CompletionItem>, newText: string) => {
      // Keep the default fuzzy-matching behavior, which also decides
      // whether the item is offered at all for the typed prefix
      const textEdit = this.buildCompletionTextEdit(context, keyword.value, newText)
      if (!textEdit) {
        return
      }
      acceptor(context, {
        label: keyword.value,
        insertTextFormat: InsertTextFormat.Snippet,
        ...item,
        textEdit,
      })
    }

    const acceptProperty = (insertAfterText: string) => {
      acceptReplacing({
        detail: `Insert ${keyword.value} property`,
        kind: CompletionItemKind.Property,
      }, `${keyword.value} ${insertAfterText}`)
    }

    const acceptSnippet = ({ insertText, ...item }: SetRequired<Partial<CompletionItem>, 'insertText'>) => {
      acceptReplacing({
        detail: `Insert ${keyword.value}`,
        kind: CompletionItemKind.Snippet,
        ...item,
      }, `${keyword.value} ${insertText}`)
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
          insertText: `view ${viewSnippet}`,
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
      case 'sizing' === keyword.value:
        acceptPropertyAndSuggest(Sizings)
        break
      case 'border' === keyword.value:
        acceptPropertyAndSuggest(BorderStyles)
        break
      case 'autoLayout' === keyword.value:
        acceptPropertyAndSuggest(['TopBottom', 'BottomTop', 'LeftRight', 'RightLeft'])
        break
      // `descriptionFile` is not here: its value is a path, not a string, so the keyword is inserted as it is
      case ['title', 'description', 'technology', 'summary', 'notes', 'notation'].includes(
        keyword.value,
      ):
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
      case 'try' === keyword.value && AstUtils.hasContainerOfType(context.node, ast.isDynamicViewBody):
        acceptSnippet({
          detail: `Insert try-catch flow`,
          kind: CompletionItemKind.Module,
          insertText: [
            '\'critical-path\' {',
            '\t$0',
            '} catch \'handling\' {',
            '} finally \'cleanup\' {',
            '}',
          ].join('\n'),
        })
        break
      case 'alt' === keyword.value && AstUtils.hasContainerOfType(context.node, ast.isDynamicViewBody):
        acceptSnippet({
          detail: `Insert alternative flow`,
          kind: CompletionItemKind.Module,
          insertText: [
            '{',
            '\twhen \'condition\' {',
            '\t\t$0',
            '\t}',
            '}',
          ].join('\n'),
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
        acceptReplacing({
          kind: CompletionItemKind.Operator,
          detail: `Insert ${keyword.value} predicate`,
          insertTextFormat: InsertTextFormat.PlainText,
        }, `${keyword.value} `)
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

/**
 * Checks whether the link candidate is inside inline code or a fenced code block,
 * where links are not processed.
 *
 * @param linesBefore - Markdown text before the current line
 * @param lineBefore - text of the current line before `[[`
 */
function isInsideCode(linesBefore: string, lineBefore: string): boolean {
  const fences = linesBefore.split('\n').filter(line => /^\s*(```|~~~)/.test(line)).length
  if (fences % 2 === 1) {
    return true
  }
  const backticks = lineBefore.match(/(?<!\\)`/g)?.length ?? 0
  return backticks % 2 === 1
}

function readTitle(value: ast.MarkdownOrString | string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }
  const title = toSingleLine(value)
  if (typeof title === 'string') {
    return title || undefined
  }
  return ('md' in title ? title.md : title.txt) || undefined
}

/**
 * Title and kind of the element
 */
/**
 * Inserts over `insert` (from its start to the cursor), or replaces up to `replaceEnd` in the replace mode
 */
function insertReplaceEdit(newText: string, insert: Range, replaceEnd: Position): InsertReplaceEdit {
  return InsertReplaceEdit.create(newText, insert, { start: insert.start, end: replaceEnd })
}

function elementDetail(desc: AstNodeDescription): string | undefined {
  const node = desc.node
  if (!ast.isElement(node)) {
    return undefined
  }
  const kind = node.kind.$refText
  const titleProp = node.body?.props.find(p => ast.isElementStringProperty(p) && p.key === 'title')
  const title = ast.isElementStringProperty(titleProp) ? readTitle(titleProp.value) : readTitle(node.props[0])
  return title ? `${title} (${kind})` : kind
}

/**
 * Title and type of the view
 */
function viewDetail(desc: AstNodeDescription): string | undefined {
  const node = desc.node
  if (!ast.isLikeC4View(node)) {
    return undefined
  }
  const titleProp = node.body?.props.find(p => ast.isViewStringProperty(p) && p.key === 'title')
  const title = ast.isViewStringProperty(titleProp) ? readTitle(titleProp.value) : undefined
  let kind: string
  switch (true) {
    case ast.isDynamicView(node):
      kind = 'dynamic view'
      break
    case ast.isDeploymentView(node):
      kind = 'deployment view'
      break
    default:
      kind = 'view'
  }
  return title ? `${title} (${kind})` : kind
}
