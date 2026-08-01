import { cursorAtScene, firstCursor, nextCursor, prevCursor } from '@likec4/core'
import type { ResolveSceneView, StoryCursor } from '@likec4/core'
import type { StepPath, StoryFlow } from '@likec4/core/types'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assign,
  setup,
} from 'xstate'

/**
 * Owns the story's traversal cursor — nothing else.
 *
 * Deliberately does not touch `LikeC4Model` or view geometry: an XState actor
 * cannot reach React context, so it has no way to call `useLikeC4Model` itself.
 * Resolving a scene's geometry (`packages/diagram/src/story/resolveScene.ts`)
 * and converting it to XYFlow nodes/edges happens in whoever drives this actor
 * (a caller that already holds the model) and then dispatches `story.scene` to
 * the main diagram machine — mirroring how `update.view` is always handed an
 * already-resolved `DiagramView`, never a bare id, because view resolution by
 * id from a model only ever happens in a React-level caller (see
 * `LikeC4View.tsx`'s `likec4model.findView(viewId)`), never inside the state
 * machine.
 *
 * `next`/`prev` reuse the exact `nextCursor`/`prevCursor` composite-cursor
 * functions Task 9 built (`@likec4/core`), rather than re-deriving traversal
 * here — the whole reason those functions exist is so this module doesn't have
 * to re-walk `StoryFlow`/`DynamicViewFlow` itself. `gotoScene` is built on the
 * newer `cursorAtScene`, which exists precisely for callers (like an outline
 * panel, or `navigateTo` interception) that jump to an arbitrary scene rather
 * than stepping relative to the current cursor.
 */
export interface Input {
  /** Traversal over the story's scenes (`StoryFlow.from(storyView)`). */
  flow: StoryFlow
  /**
   * Resolves a scene's view id to a dynamic view, so the cursor can descend
   * into its steps. Model-bound in the general case; the caller that spawns
   * this actor is responsible for supplying a real implementation once it has
   * model access (see `machine.ts`'s spawn site for the current placeholder).
   */
  resolve: ResolveSceneView
}

export type Events =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'gotoScene'; sceneId: StepPath }

export interface Context extends Input {
  cursor: StoryCursor | null
}

export function Context({ input }: { input: Input }): Context {
  return {
    ...input,
    cursor: firstCursor(input.flow, input.resolve),
  }
}

const actor = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
    input: {} as Input,
  },
})

/**
 * `next`/`prev` fall back to the current cursor when the move would exhaust
 * the story (cursor.ts returns `null` "once the end/start of the story is
 * reached"). Setting `cursor: null` here instead would be a dead end: both
 * `nextCursor` and `prevCursor` require a non-null `StoryCursor` to step from,
 * so a null context cursor could never move again. What "reaching the end of
 * the story" should *do* (advance to a following scene, or leave the story
 * entirely per RFC 0001) is a `navigateTo`-interception decision — out of
 * scope here (Task 12) — so this actor just stays put at the boundary and
 * lets a future caller decide what a boundary means.
 */
const _actorLogic = actor.createMachine({
  id: 'story',
  context: ({ input }) => Context({ input }),
  on: {
    next: {
      actions: assign(({ context }) => {
        if (!context.cursor) {
          return {}
        }
        return { cursor: nextCursor(context.flow, context.resolve, context.cursor) ?? context.cursor }
      }),
    },
    prev: {
      actions: assign(({ context }) => {
        if (!context.cursor) {
          return {}
        }
        return { cursor: prevCursor(context.flow, context.resolve, context.cursor) ?? context.cursor }
      }),
    },
    gotoScene: {
      actions: assign(({ context, event }) => {
        return { cursor: cursorAtScene(context.flow, context.resolve, event.sceneId) ?? context.cursor }
      }),
    },
  },
})

export interface StoryActorLogic extends
  StateMachine<
    Context,
    Events,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    Input,
    any,
    any,
    any,
    any
  >
{}

export const storyActorLogic: StoryActorLogic = _actorLogic as any

export type StoryActorSnapshot = SnapshotFrom<StoryActorLogic>

export interface StoryActorRef extends ActorRef<StoryActorSnapshot, Events, never> {}
