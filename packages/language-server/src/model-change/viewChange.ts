import { type scalar, type ViewChange, type ViewId, invariant, nonNullable } from '@likec4/core'
import {
  type AnyOp,
  type InferOp,
  indent,
  merge,
  newline,
  operators,
  print,
  printTabIndent,
  withctx,
} from '@likec4/generators/likec4'
import { type MaybePromise, TextDocument } from 'langium'
import { find, findLast, hasAtLeast, last, piped } from 'remeda'
import { Position, TextDocumentEdit, TextEdit } from 'vscode-languageserver-protocol'
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'
import type { ProjectData } from '../workspace/ProjectsManager'

export type ViewChangePayload<Op extends ViewChange['op']> = {
  viewId: ViewId
  project: ProjectData
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  change: Extract<ViewChange, { op: Op }>
  services: LikeC4Services
  workspace: LikeC4Services['shared']['workspace']
  // applyTextEdit: (edit: TextEdit) => Promise<ast.LikeC4View>
}

export function preparePayload(request: ChangeView.Params, services: LikeC4Services): AnyPayload {
  const workspace = services.shared.workspace
  const DocumentBuilder = workspace.DocumentBuilder
  let { viewId, projectId: _projectId, change } = request
  const project = workspace.ProjectsManager.ensureProject(_projectId as scalar.ProjectId)
  const lookup = services.likec4.ModelLocator.locateViewAst(viewId, project.id)
  if (!lookup) {
    throw new Error(`View ${viewId} not found in project ${project.id}`)
  }
  const doc = lookup.doc

  // /**
  //  * Returns the updated view AST
  //  */
  // const applyTextEdit = async ({ range, newText: text }: TextEdit): Promise<ast.LikeC4View> => {
  //   TextDocument.update(
  //     doc.textDocument,
  //     [{ text, range }],
  //     doc.textDocument.version + 1,
  //   )
  //   workspace.LangiumDocuments.invalidateDocument(doc.uri)
  //   await DocumentBuilder.build([doc], { validation: false })
  //   const { astPath } = nonNullable(
  //     find(doc.c4Views, v => v.id === viewId),
  //     `View ${viewId} was lost after text edit`,
  //   )
  //   const viewAst = services.workspace.AstNodeLocator.getAstNode(
  //     doc.parseResult.value,
  //     astPath,
  //   )
  //   invariant(ast.isLikeC4View(viewAst), 'AST node is not a view')
  //   return viewAst
  // }

  return {
    viewId,
    change,
    services,
    project,
    doc,
    viewAst: lookup.viewAst,
    workspace,
    // applyTextEdit,
  }
}

export type AnyPayload = ViewChangePayload<ViewChange['op']>

export type ViewChangeHandlerResult = TextEdit | TextEdit[]

export interface ViewChangeHandler<Op extends ViewChange['op']> {
  (args: ViewChangePayload<Op>): MaybePromise<ViewChangeHandlerResult>
}

export function viewChangeHandler<Op extends ViewChange['op']>(
  op: Op,
  handler: ViewChangeHandler<Op>,
) {
  return (payload: AnyPayload): undefined | MaybePromise<ViewChangeHandlerResult> => {
    if (payload.change.op !== op) {
      return undefined
    }
    return handler(payload as ViewChangePayload<Op>)
  }
}

export const changePropertyHandler = viewChangeHandler(
  'change-property',
  async ({ change, viewAst }) => {
    const { title, description } = change

    const edits: TextEdit[] = []

    if (title !== undefined) {
      edits.push(
        updateViewTitle(viewAst, title),
      )
    }

    if (description !== undefined) {
      edits.push(
        updateViewDescription(viewAst, description),
      )
    }

    if (change.tag !== undefined) {
      edits.push(
        ...updateViewTags(viewAst, change.tag),
      )
    }

    return edits
  },
)

type PropOf<V extends ast.LikeC4View> = NonNullable<V['body']>['props'][number]

type WithCst<T extends { $cstNode?: any }> = T & { $cstNode: NonNullable<T['$cstNode']> }

function findExistingViewProperty<
  V extends ast.LikeC4View,
  P extends PropOf<V>['key'],
  T extends WithCst<PropOf<V> & { key: P }> = WithCst<PropOf<V> & { key: P }>,
>(
  viewAst: V,
  property: P,
): T | undefined {
  const props = viewAst.body?.props
  if (!props || !hasAtLeast(props, 1)) {
    return undefined
  }
  return findLast(props, (p): p is T => p.key === property && p.$cstNode !== undefined)
}

function findInsertPosition<V extends ast.LikeC4View>(
  viewAst: V,
  select: (body: NonNullable<V['body']>) => Position | undefined,
) {
  const body = nonNullable(viewAst.body, 'View body is required')
  const position = select(body)
  if (!position) {
    return Position.create(0, 0)
  }
  const { line, character } = position
  return Position.create(line, character + 1)
}

const doubleIndent = (op: AnyOp): AnyOp =>
  piped(
    newline(),
    indent(
      indent(op),
    ),
  )

function updateViewTitle(viewAst: ast.LikeC4View, title: string): TextEdit {
  const existing = findExistingViewProperty(viewAst, 'title')

  const titleOut = withctx({ title })(
    operators.props.titleProperty(),
  )

  // Replace existing title property
  if (existing) {
    return TextEdit.replace(
      existing.$cstNode.range,
      print(titleOut),
    )
  }

  // Insert new title property, after tags or at the body start
  return TextEdit.insert(
    findInsertPosition(
      viewAst,
      body =>
        // right after tags
        body.tags?.$cstNode?.range.end
          //  or after "{" (view body start)
          ?? body.$cstNode?.range.start,
    ),
    print(
      doubleIndent(titleOut),
    ).trimEnd(),
  )
}
function collectAllTagRefs(tags: ast.Tags | undefined): Array<WithCst<ast.TagRef>> {
  const result: Array<WithCst<ast.TagRef>> = []
  let iter = tags
  while (iter) {
    for (const ref of iter.values) {
      if (ref.$cstNode) {
        result.push(ref as WithCst<ast.TagRef>)
      }
    }
    iter = iter.prev
  }
  // Linked list traversal goes newest-first; reverse to get document order
  return result.reverse()
}

function addTag(viewAst: ast.LikeC4View, body: NonNullable<ast.LikeC4View['body']>, tagName: string): TextEdit {
  const tagsNode = body.tags

  // Append to existing tags
  if (tagsNode?.$cstNode) {
    return TextEdit.insert(
      tagsNode.$cstNode.range.end,
      `, #${tagName}`,
    )
  }

  // Insert new tags line at body start (right after "{")
  return TextEdit.insert(
    findInsertPosition(
      viewAst,
      body => body.$cstNode?.range.start,
    ),
    `\n    #${tagName}`,
  )
}

function removeTag(body: NonNullable<ast.LikeC4View['body']>, tagName: string): TextEdit | undefined {
  const allRefs = collectAllTagRefs(body.tags)
  const targetIndex = allRefs.findIndex(ref => ref.tag.ref?.name === tagName)

  if (targetIndex < 0) {
    return undefined
  }

  // Only one tag — remove the entire tags line (including leading newline+indent)
  if (allRefs.length === 1) {
    const tagsNode = body.tags
    if (tagsNode?.$cstNode) {
      const { start } = tagsNode.$cstNode.range
      // Delete from end of previous line through start of next line,
      // so the entire tags line (including its newline) disappears
      return TextEdit.del({
        start: Position.create(start.line - 1, Number.MAX_SAFE_INTEGER),
        end: Position.create(start.line + 1, 0),
      })
    }
    return undefined
  }

  const target = allRefs[targetIndex]!

  if (targetIndex > 0) {
    // Not first — remove from previous tag end to this tag end
    const prev = allRefs[targetIndex - 1]!
    return TextEdit.del({
      start: prev.$cstNode.range.end,
      end: target.$cstNode.range.end,
    })
  }

  // First tag — remove from this tag start to next tag start
  const next = allRefs[targetIndex + 1]!
  return TextEdit.del({
    start: target.$cstNode.range.start,
    end: next.$cstNode.range.start,
  })
}

function updateViewTags(
  viewAst: ast.LikeC4View,
  tag: NonNullable<ViewChange.ChangeProperty['tag']>,
): TextEdit[] {
  const edits: TextEdit[] = []
  const body = nonNullable(viewAst.body, 'View body is required')

  if (tag.add) {
    edits.push(addTag(viewAst, body, tag.add))
  }
  if (tag.remove) {
    const edit = removeTag(body, tag.remove)
    if (edit) {
      edits.push(edit)
    }
  }

  return edits
}

function updateViewDescription(viewAst: ast.LikeC4View, description: scalar.MarkdownOrString): TextEdit {
  const existing = findExistingViewProperty(viewAst, 'description')

  const descriptionOut = withctx({ description })(
    operators.props.descriptionProperty(),
  )

  // Replace existing description property
  if (existing) {
    return TextEdit.replace(
      existing.$cstNode.range,
      print(descriptionOut),
    )
  }
  // Insert new title property, after tags or at the body start
  return TextEdit.insert(
    findInsertPosition(
      viewAst,
      body =>
        // After last property
        last(body.props)?.$cstNode?.range.end
          // or after tags
          ?? body.tags?.$cstNode?.range.end
          //  or after "{" (view body start)
          ?? body.$cstNode?.range.start,
    ),
    print(
      doubleIndent(descriptionOut),
    ),
  )
}
