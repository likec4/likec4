import { type scalar, type ViewChange, type ViewId, nonNullable } from '@likec4/core'
import { splitViewFolderPath, VIEW_FOLDERS_SEPARATOR } from '@likec4/core/model'
import {
  type AnyOp,
  indent,
  materialize,
  newline,
  ops,
  print,
  printOperation,
  withctx,
} from '@likec4/generators/likec4'
import { filter, findLast, hasAtLeast, isTruthy, last, map, pipe, piped } from 'remeda'
import { Position, TextEdit } from 'vscode-languageserver-protocol'
import { type ParsedLikeC4LangiumDocument, ast } from '../ast'
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
}

export function preparePayload(request: ChangeView.Params, services: LikeC4Services): AnyPayload {
  const workspace = services.shared.workspace
  let { viewId, projectId: _projectId, change } = request
  const project = workspace.ProjectsManager.ensureProject(_projectId as scalar.ProjectId)
  const lookup = services.likec4.ModelLocator.locateViewAst(viewId, project.id)
  if (!lookup) {
    throw new Error(`View ${viewId} not found in project ${project.id}`)
  }
  return {
    viewId,
    change,
    services,
    project,
    doc: lookup.doc,
    viewAst: lookup.viewAst,
    workspace,
  }
}

export type AnyPayload = ViewChangePayload<ViewChange['op']>

export type ViewChangeHandlerResult = TextEdit | TextEdit[]

export interface ViewChangeHandler<Op extends ViewChange['op']> {
  (args: ViewChangePayload<Op>): ViewChangeHandlerResult
}

export function viewChangeHandler<Op extends ViewChange['op']>(
  op: Op,
  handler: ViewChangeHandler<Op>,
) {
  return (payload: AnyPayload): undefined | ViewChangeHandlerResult => {
    if (payload.change.op !== op) {
      return undefined
    }
    return handler(payload as ViewChangePayload<Op>)
  }
}

export const changePropertyHandler = viewChangeHandler(
  'change-property',
  ({ change, viewAst }) => {
    const { title, description } = change

    const edits: TextEdit[] = []

    if (title !== undefined) {
      edits.push(
        updateViewTitle(viewAst, title),
      )
    }

    if (description !== undefined) {
      edits.push(
        ...updateViewDescription(viewAst, description),
      )
    }

    if (change.tags !== undefined) {
      edits.push(
        ...updateViewTags(viewAst, change.tags),
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

  const parents = splitViewFolderPath(viewAst.$container.folder ?? '')
  const viewpath = splitViewFolderPath(title)
  while (viewpath[0] && parents[0] === viewpath[0]) {
    viewpath.shift()
    parents.shift()
  }
  title = viewpath.join(` ${VIEW_FOLDERS_SEPARATOR} `)

  const titleOut = withctx({ title })(
    ops.props.titleProperty(),
  )

  // Replace existing title property
  if (existing) {
    return TextEdit.replace(
      existing.$cstNode.range,
      printOperation(titleOut),
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
    materialize(
      doubleIndent(titleOut),
    ).trimEnd(),
  )
}

function replaceTags(
  viewAst: ast.LikeC4View,
  body: NonNullable<ast.LikeC4View['body']>,
  tags: scalar.Tag[],
): TextEdit | undefined {
  const tagsNode = body.tags

  const printTags = print(tags.map(t => `#${t}`).join(' '))

  // Replace existing tags
  if (tagsNode?.$cstNode) {
    if (tags.length === 0) {
      return TextEdit.del({
        // after "{" (view body start)
        start: findInsertPosition(
          viewAst,
          body => body.$cstNode?.range.start,
        ),
        end: tagsNode.$cstNode.range.end,
      })
    }
    return TextEdit.replace(
      tagsNode.$cstNode.range,
      materialize(printTags),
    )
  }

  // No existing tags, and no tags to add - nothing to do
  if (tags.length === 0) {
    return undefined
  }

  // Insert new tags line at body start (right after "{")
  return TextEdit.insert(
    findInsertPosition(
      viewAst,
      body => body.$cstNode?.range.start,
    ),
    materialize(
      doubleIndent(
        printTags,
      ),
    ).trimEnd(),
  )
}

function updateViewTags(
  viewAst: ast.LikeC4View,
  tags: NonNullable<ViewChange.ChangeProperty['tags']>,
): TextEdit[] {
  const body = nonNullable(viewAst.body, 'View body is required')
  const edit = replaceTags(viewAst, body, tags)

  return edit ? [edit] : []
}

function updateViewDescription(viewAst: ast.LikeC4View, description: scalar.MarkdownOrString): TextEdit[] {
  const existing = findExistingViewProperty(viewAst, 'description')

  const descriptionOut = withctx(
    { description },
    indent(
      indent(
        ops.props.descriptionProperty(),
      ),
    ),
  )

  // Replace existing description property
  if (existing) {
    return [TextEdit.replace(
      {
        start: {
          line: existing.$cstNode.range.start.line,
          character: 0,
        },
        end: existing.$cstNode.range.end,
      },
      materialize(
        descriptionOut,
      ).trimEnd(),
    )]
  }
  // Insert new view description
  const insertPosition = findInsertPosition(
    viewAst,
    body =>
      // After last property
      pipe(
        body.props,
        map(p => p.$cstNode?.range.end),
        filter(isTruthy),
        last(),
      )
        // or after tags
        ?? body.tags?.$cstNode?.range.end
        //  or after "{" (view body start)
        ?? body.$cstNode?.range.start,
  )
  // Move to the next line and add the description
  return [
    TextEdit.insert(
      {
        line: insertPosition.line + 1,
        character: 0,
      },
      materialize(descriptionOut),
    ),
  ]
}
