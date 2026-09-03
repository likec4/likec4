import { DefaultWeakMap } from '../utils'
import type * as scalar from './scalar'
import type { ComputedStoryScene, ComputedStoryView } from './view-computed'

/**
 * Traversal over a story's scenes.
 *
 * Unlike `DynamicViewFlow`, this class does not walk a statement tree. `computeStoryView`
 * already flattens `alt` branches into `view.scenes`, depth-first, in traversal order. So
 * `StoryFlow` only needs a path→index lookup over that array; `prevAndNext` is a plain
 * index step. See RFC 0001, "StoryFlow".
 */
export class StoryFlow {
  private static cache = new DefaultWeakMap((view: ComputedStoryView<any>) => new StoryFlow(view))

  public static from(view: ComputedStoryView<any>): StoryFlow {
    return this.cache.get(view)
  }

  private readonly byId: ReadonlyMap<scalar.StepPath, number>

  private constructor(public readonly view: ComputedStoryView<any>) {
    this.byId = new Map(view.scenes.map((scene, index) => [scene.id, index]))
  }

  get scenes(): ReadonlyArray<ComputedStoryScene<any>> {
    return this.view.scenes
  }

  /**
   * First scene in traversal order, or `null` if the story has no scenes.
   */
  firstScene(): scalar.StepPath | null {
    return this.view.scenes[0]?.id ?? null
  }

  /**
   * Last scene in traversal order, or `null` if the story has no scenes.
   */
  lastScene(): scalar.StepPath | null {
    return this.view.scenes.at(-1)?.id ?? null
  }

  /**
   * Looks up a scene by its path, or `undefined` if the path is unknown.
   */
  lookup(id: scalar.StepPath): ComputedStoryScene<any> | undefined {
    const index = this.byId.get(id)
    return index === undefined ? undefined : this.view.scenes[index]
  }

  /**
   * Previous and next scene in depth-first traversal order.
   *
   * Scenes are already flattened in traversal order by `computeStoryView`, so alt
   * branches are visited one after another — matching dynamic-view `alt` semantics.
   * Returns `{ prev: null, next: null }` for an unknown path.
   */
  prevAndNext(id: scalar.StepPath): {
    prev: scalar.StepPath | null
    next: scalar.StepPath | null
  } {
    const index = this.byId.get(id)
    if (index === undefined) {
      return { prev: null, next: null }
    }
    return {
      prev: this.view.scenes[index - 1]?.id ?? null,
      next: this.view.scenes[index + 1]?.id ?? null,
    }
  }
}

/**
 * Creates a `StoryFlow` for the given story view.
 * Convenience wrapper around `StoryFlow.from()`.
 */
export function storyFlow(view: ComputedStoryView<any>): StoryFlow {
  return StoryFlow.from(view)
}
