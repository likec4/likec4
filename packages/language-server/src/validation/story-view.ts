import { type ValidationCheck, AstUtils } from 'langium'
import { filter } from 'remeda'
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

  /**
   * Depth-first pre-order walk over the story's statement tree, collecting each scene's
   * resolved view id in traversal order. This mirrors the walk `computeStoryView`
   * (`packages/core/src/compute-view/story-view/compute.ts`) uses to flatten a story into
   * its `scenes` list, and the AST-level walk `storySceneChecks` (below) performs for the
   * same reason (validation runs before any view is computed) — kept as its own small copy
   * here rather than factored out, since the two walks collect different things (predecessor
   * existence vs. view-id order) and would gain nothing from sharing beyond the shape.
   */
  const collectSceneViewIds = (statements: readonly ast.StoryStatement[], out: string[]): void => {
    for (const statement of statements) {
      if (ast.isStoryScene(statement)) {
        const viewId = statement.view.ref?.name
        if (viewId) {
          out.push(viewId)
        }
      } else if (ast.isStoryAlt(statement)) {
        for (const branch of statement.branches) {
          collectSceneViewIds(branch.statements, out)
        }
      } else if (ast.isStorySubflow(statement)) {
        collectSceneViewIds(statement.statements, out)
      }
    }
  }

  return tryOrLog((el, accept) => {
    const statements = el.body?.statements ?? []
    if (!hasScene(statements)) {
      accept('warning', 'Story has no scenes', { node: el, property: 'name' })
    }

    // A repeated view id in the flattened traversal is a legitimate DSL pattern (RFC 0001's
    // depth-first `alt` traversal routinely revisits the same view from different branches —
    // see `examples/cloud-system/story.c4`), but scene identity in `packages/diagram` is
    // currently keyed by view id, not by the scene's own `StepPath` occurrence id, so scene
    // stepping, boundary detection, and anchors cannot currently distinguish between the
    // occurrences. Warn (not error) once per repeated view id.
    const viewIds: string[] = []
    collectSceneViewIds(statements, viewIds)
    const seen = new Set<string>()
    const warnedFor = new Set<string>()
    for (const viewId of viewIds) {
      if (seen.has(viewId) && !warnedFor.has(viewId)) {
        warnedFor.add(viewId)
        accept(
          'warning',
          `Scene '${viewId}' appears more than once in this story's traversal order. Scene stepping, boundary detection, and anchors cannot currently distinguish between the occurrences — see docs/superpowers/plans/2026-08-04-story-scene-anchor.md.`,
          { node: el, property: 'name' },
        )
      }
      seen.add(viewId)
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

/**
 * A scene with no predecessor has nothing to anchor against — declaring
 * `anchor` there can never have an effect, and per this feature's design
 * that's treated as an author mistake, not silently ignored.
 *
 * "No predecessor" is determined the same way `computeStoryView`
 * (`packages/core/src/compute-view/story-view/compute.ts`) flattens scenes:
 * a depth-first pre-order walk over the story's `statements` tree. This walk
 * is duplicated at the AST level (rather than reusing the core-level walk)
 * because validation runs on the AST before any view is computed.
 *
 * Also rejects more than one `anchor` in the same scene. `anchor` used to
 * have its own strict-order grammar slot (`anchor=StoryAnchorProperty?`),
 * which structurally guaranteed at most one occurrence but forced `anchor`
 * to appear after every prop/note and before any `becomes` rule — misplacing
 * it produced a misleading "Could not resolve reference to Referenceable
 * named 'anchor'" parse error instead of pointing at the real problem.
 * `anchor` now lives in the unordered `props` alternation like every other
 * scene-level property, so nothing at the grammar level stops `anchor a;
 * anchor b;` from parsing — this check closes that gap with a clean
 * diagnostic instead of a silent last-write-wins overwrite.
 */
export const storySceneChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.StoryScene> => {
  return tryOrLog((el, accept) => {
    const anchors = filter(el.body?.props ?? [], ast.isStoryAnchorProperty)
    if (anchors.length > 1) {
      for (const extra of anchors.slice(1)) {
        accept('error', 'A scene can only declare one "anchor"', {
          node: extra,
        })
      }
    }

    const anchor = anchors[0]
    if (!anchor) {
      return
    }
    const story = AstUtils.getContainerOfType(el, ast.isStoryView)
    if (!story?.body) {
      return
    }
    let sawEarlierScene = false
    let isFirst = true
    const visit = (statements: readonly ast.StoryStatement[]) => {
      for (const statement of statements) {
        if (ast.isStoryScene(statement)) {
          if (statement === el) {
            isFirst = !sawEarlierScene
            return
          }
          sawEarlierScene = true
        } else if (ast.isStoryAlt(statement)) {
          for (const branch of statement.branches) {
            visit(branch.statements)
          }
        } else if (ast.isStorySubflow(statement)) {
          visit(statement.statements)
        }
      }
    }
    visit(story.body.statements)
    if (isFirst) {
      accept('error', 'The first scene in a story has no prior scene to anchor against', {
        node: el,
        property: 'body',
      })
    }
  })
}
