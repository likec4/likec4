import { type scalar, type ViewChange, type ViewId, nonNullable } from '@likec4/core'
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
function collectAllTagRefs(tags: ast.Tags | undefined): Array<WithCst<ast.TagRef>> {
  // Linked list: body.tags is the last comma-separated group, prev points backward.
  // Within each group, values are in document order.
  // We collect groups in reverse, then reverse the groups (not their contents) to get document order.
  const groups: Array<Array<WithCst<ast.TagRef>>> = []
  let iter = tags
  while (iter) {
    const group: Array<WithCst<ast.TagRef>> = []
    for (const ref of iter.values) {
      if (ref.$cstNode) {
        group.push(ref as WithCst<ast.TagRef>)
      }
    }
    groups.push(group)
    iter = iter.prev
  }
  return groups.reverse().flat()
}

function addTag(viewAst: ast.LikeC4View, body: NonNullable<ast.LikeC4View['body']>, tagName: scalar.Tag): TextEdit {
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
    materialize(
      doubleIndent(
        print(`#${tagName}`),
      ),
    ).trimEnd(),
  )
}

function removeTag(body: NonNullable<ast.LikeC4View['body']>, tagName: scalar.Tag): TextEdit | undefined {
  const allRefs = collectAllTagRefs(body.tags)
  const targetIndex = allRefs.findIndex(ref => ref.tag.ref?.name === tagName)

  if (targetIndex < 0) {
    return undefined
  }

  // Only one tag — remove the entire tags line (including its trailing newline)
  if (allRefs.length === 1) {
    const tagsNode = body.tags
    if (tagsNode?.$cstNode) {
      const { start } = tagsNode.$cstNode.range
      return TextEdit.del({
        start: Position.create(start.line, 0),
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
    const names = Array.isArray(tag.add) ? tag.add : [tag.add]
    for (const name of names) {
      if (name) {
        edits.push(addTag(viewAst, body, name))
      }
    }
  }
  if (tag.remove) {
    const names = Array.isArray(tag.remove) ? tag.remove : [tag.remove]
    for (const name of names) {
      const edit = name ? removeTag(body, name) : undefined
      if (edit) {
        edits.push(edit)
      }
    }
  }

  return edits
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
