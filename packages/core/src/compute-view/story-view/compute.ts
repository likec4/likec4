import type { LikeC4Model } from '../../model'
import {
  type AnyStoryStatement,
  type ComputedStoryScene,
  type ComputedStoryView,
  type ParsedStoryView,
  _stage,
  _type,
  StepPath,
  storyGuards,
} from '../../types'
import type { Any } from '../../types/_aux'
import { nonexhaustive, nonNullable } from '../../utils'
import { calcViewLayoutHash } from '../utils/view-hash'

/**
 * Computes a story view.
 *
 * A story owns no geometry: `nodes` and `edges` are always empty, and each scene
 * defers to the view it names. This keeps the layout pipeline untouched and makes
 * manual-layout drift inapplicable by construction. See RFC 0001, "A story is a
 * view" and "Compute".
 */
export function computeStoryView<A extends Any>(
  likec4model: LikeC4Model<any>,
  parsed: ParsedStoryView<A>,
): ComputedStoryView<A> {
  const scenes: ComputedStoryScene<A>[] = []

  // Depth-first walk over the statement tree, flattening `alt` branches into a single
  // array in traversal order. Downstream consumers (StoryFlow.prevAndNext, and the
  // composite cursor built on top of it) depend on `scenes` being in this order.
  const walk = (
    statements: readonly AnyStoryStatement<A>[],
    prefix: ReadonlyArray<number | [number, string]>,
    branchTitle: string | undefined,
  ): void => {
    statements.forEach((statement, index) => {
      const position = index + 1
      switch (true) {
        // Must be checked before isSubflow: isSubflow is defined by exclusion
        // (`_type !== 'alt'`) and would otherwise misclassify scenes, which carry no
        // `[_type]` at all.
        case storyGuards.isScene(statement): {
          // `likec4model.findView` only resolves once views are computed/layouted
          // (`$View<A>` is `never` at the `parsed` stage — see `model/types.ts`), and
          // this function runs against a still-parsed model (`computeParsedModelData`
          // constructs `likec4model` from `ParsedLikeC4ModelData` before computing any
          // view). So the existence check goes through the stage-agnostic raw
          // `$data.views` record instead.
          nonNullable(
            likec4model.$data.views[statement.view],
            `Story "${parsed.id}" references view "${statement.view}", which does not exist in the model`,
          )
          scenes.push({
            id: StepPath(...prefix, position),
            view: statement.view,
            title: statement.title ?? null,
            ...(statement.notes !== undefined && { notes: statement.notes }),
            ...(statement.becomes !== undefined && { becomes: statement.becomes }),
            ...(branchTitle !== undefined && { branchTitle }),
            astPath: statement.astPath,
          })
          return
        }
        case storyGuards.isAlt(statement): {
          statement.branches.forEach((branch, branchIndex) => {
            walk(
              branch.statements,
              [...prefix, [position, 'alt'], [branchIndex + 1, branch[_type]]],
              branch.title ?? statement.title ?? branchTitle,
            )
          })
          return
        }
        case storyGuards.isSubflow(statement): {
          // Unreachable in the MVP: validation rejects every non-`alt` block kind
          // (`opt` / `par` / `loop` / `break`) before compute ever sees one (RFC 0001,
          // "Flow control beyond alt"). Still handled structurally, rather than thrown,
          // so a future relaxation of validation does not silently drop nested scenes.
          walk(
            statement.statements,
            [...prefix, [position, statement[_type]]],
            statement.title ?? branchTitle,
          )
          return
        }
        default:
          nonexhaustive(statement)
      }
    })
  }

  walk(parsed.statements, [], undefined)

  const { sceneLayout = 'anchored', statements, ...props } = parsed

  return calcViewLayoutHash({
    ...props,
    [_stage]: 'computed',
    [_type]: 'story',
    sceneLayout,
    scenes,
    storyFlow: statements,
    nodes: [],
    edges: [],
    autoLayout: { direction: 'TB' },
  }) as ComputedStoryView<A>
}
