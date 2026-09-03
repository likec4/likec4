import type { AnyStoryView, ComputedStoryScene } from '@likec4/core/types'

/**
 * Index of the scene currently on screen within `story.scenes`, or `-1` when
 * `currentViewId` is not one of the story's scenes.
 *
 * Guards with `'scenes' in story` because `AnyStoryView` also covers
 * `ParsedStoryView`, which has no flattened `.scenes` list yet (it only has
 * `.statements`, pre-flattening) — a shape that never actually reaches the
 * diagram (rendering only happens from a computed/layouted model), but the
 * type admits it, so this stays total rather than throwing. (`hasProp` from
 * `@likec4/core/types` can't be used here: its `P extends keyof T & string`
 * constraint requires the property to exist on every union member, which
 * `'scenes'` does not since `ParsedStoryView` lacks it entirely — the plain
 * `in` operator narrows per-member instead.)
 */
export function currentSceneIndex(story: AnyStoryView<any>, currentViewId: string): number {
  if (!('scenes' in story)) {
    return -1
  }
  return story.scenes.findIndex(scene => scene.view === currentViewId)
}

/**
 * The scene currently on screen, or `null` when `currentViewId` is not one of
 * the story's scenes.
 */
export function currentScene(story: AnyStoryView<any>, currentViewId: string): ComputedStoryScene<any> | null {
  if (!('scenes' in story)) {
    return null
  }
  const index = currentSceneIndex(story, currentViewId)
  return index === -1 ? null : story.scenes[index] ?? null
}

/**
 * The scene immediately before the current one, or `null` at the first scene
 * (or when `currentViewId` is not one of the story's scenes).
 */
export function prevScene(story: AnyStoryView<any>, currentViewId: string): ComputedStoryScene<any> | null {
  if (!('scenes' in story)) {
    return null
  }
  const index = currentSceneIndex(story, currentViewId)
  return index > 0 ? story.scenes[index - 1] ?? null : null
}

/**
 * The scene immediately after the current one, or `null` at the last scene
 * (or when `currentViewId` is not one of the story's scenes).
 */
export function nextScene(story: AnyStoryView<any>, currentViewId: string): ComputedStoryScene<any> | null {
  if (!('scenes' in story)) {
    return null
  }
  const index = currentSceneIndex(story, currentViewId)
  return index === -1 ? null : story.scenes[index + 1] ?? null
}
