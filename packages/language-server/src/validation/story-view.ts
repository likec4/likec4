import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

const IMPLEMENTED_BRANCH_KINDS = ['when', 'if', 'else'] as const

const isAltBranchKind = (kind: string): boolean =>
  IMPLEMENTED_BRANCH_KINDS.includes(kind as typeof IMPLEMENTED_BRANCH_KINDS[number])

/**
 * A scene must target a playable view (element, dynamic, or deployment view).
 * Stories cannot nest other stories.
 */
export const storySceneChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryScene> => {
  return tryOrLog((el, accept) => {
    const target = el.view.ref
    if (target && ast.isStoryView(target)) {
      accept('error', 'A scene can not reference a story view', {
        node: el,
        property: 'view',
      })
    }
  })
}

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
 * nothing to play.
 */
export const storyViewChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryView> => {
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
