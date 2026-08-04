import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { tryOrLog } from './_shared'

// `storySceneChecks` (which used to reject `scene x` where `x` is a story, i.e. nested
// stories) was removed here. Since stories moved into their own sibling `stories { }` block
// (RFC 0002), `StoryScene.view=[LikeC4View]` structurally can no longer resolve to a
// `StoryView` at all — a story is no longer exported under the `LikeC4View` type, so
// `el.view.ref` could never again be a story and the check was dead code. `scene other`
// naming a story now fails to link at all, surfacing Langium's own
// "Could not resolve reference to LikeC4View named '...'" diagnostic instead — still an
// error, just no longer a custom one.

const IMPLEMENTED_BRANCH_KINDS = ['when', 'if', 'else'] as const

const isAltBranchKind = (kind: string): boolean =>
  IMPLEMENTED_BRANCH_KINDS.includes(kind as typeof IMPLEMENTED_BRANCH_KINDS[number])

/**
 * The grammar admits every `SubflowKind` block for forward compatibility with RFC 0001,
 * but only `alt` and its `when` / `if` / `else` branches are implemented today. This check
 * enforces that:
 * - `when` / `if` / `else` blocks only appear directly inside `alt`.
 * - Any other block kind (`opt`, `par`, `parallel`, `loop`, `break`) never appears inside `alt`
 *   as if it were a branch.
 * - Any other block kind used outside `alt` fails with an explicit "not yet supported" error,
 *   rather than silently doing nothing.
 */
export const storySubflowChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StorySubflow> => {
  return tryOrLog((el, accept) => {
    const insideAlt = ast.isStoryAlt(el.$container)

    if (isAltBranchKind(el.kind)) {
      if (!insideAlt) {
        accept('error', `"${el.kind}" alternative branch must be inside "alt"`, {
          node: el,
          property: 'kind',
        })
      }
      return
    }

    if (insideAlt) {
      accept(
        'error',
        `"${el.kind}" can not be used as an alternative branch, only "if", "when" or "else" are allowed`,
        { node: el, property: 'kind' },
      )
      return
    }

    // Parsed for forward compatibility, gated until implemented. See RFC 0001.
    accept('error', `"${el.kind}" is not yet supported in stories`, {
      node: el,
      property: 'kind',
    })
  })
}

/**
 * Warns when a story has no scenes anywhere in its statement tree, since such a story has
 * nothing to play. Also rejects two stories sharing the same id.
 *
 * Story ids and view ids are deliberately treated as separate namespaces: a `view foo { }`
 * and a `story foo { }` in the same project are allowed to coexist. Stories moved out of
 * `views { }` into their own sibling `stories { }` block (see RFC 0002) precisely because a
 * story is not a substitutable kind of view — it is addressed through its own
 * `ModelLocator.locateStoryAst`, never through `locateViewAst`, and nothing in the grammar
 * cross-references a story by id (`StoryScene.view` always targets `[LikeC4View]`). RFC 0002
 * §5 left cross-type collision explicitly unresolved; this is the resolution.
 */
export const storyViewChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.StoryView> => {
  const index = services.shared.workspace.IndexManager
  const hasScene = (statements: ast.StoryStatement[]): boolean =>
    statements.some(s => {
      switch (true) {
        case ast.isStoryScene(s):
          return true
        case ast.isStoryAlt(s):
          return s.branches.some(b => hasScene(b.statements))
        case ast.isStorySubflow(s):
          return hasScene(s.statements)
        default:
          return false
      }
    })

  return tryOrLog((el, accept) => {
    const statements = el.body?.statements ?? []
    if (!hasScene(statements)) {
      accept('warning', 'Story has no scenes', { node: el, property: 'name' })
    }

    if (!el.name) {
      return
    }
    const projectId = projectIdFrom(el)
    const otherStories = index
      .projectElements(projectId, ast.StoryView)
      .filter(n => n.name === el.name)
      .limit(2)
      .count()
    if (otherStories > 1) {
      accept('error', `Duplicate story '${el.name}'`, {
        node: el,
        property: 'name',
      })
    }
  })
}

/**
 * An `alt` block must have at least one branch to be meaningful.
 */
export const storyAltChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryAlt> => {
  return tryOrLog((el, accept) => {
    if (el.branches.length === 0) {
      accept('error', 'Alt must have at least one branch', { node: el })
    }
  })
}
