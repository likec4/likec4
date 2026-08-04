import type {
  AnyAux,
  AnyStoryStatement,
  ComputedStoryScene,
  Link,
} from '../../types'
import { isOnStage } from '../../types'
import type * as aux from '../../types/_aux'
import type { AnyStoryView } from '../../types/view'
import type { LikeC4Model } from '../LikeC4Model'

/**
 * Read-only view over a story. Unlike {@link LikeC4ViewModel}, a story has no geometry
 * (no nodes/edges to traverse), so this is intentionally not a subclass of it — see
 * RFC 0002 §6.
 */
export class LikeC4StoryModel<A extends AnyAux = AnyAux> {
  constructor(
    private readonly model: LikeC4Model<A>,
    private readonly story: AnyStoryView<A>,
  ) {}

  get id() {
    return this.story.id
  }

  get title() {
    return this.story.title
  }

  get description() {
    return this.story.description
  }

  get order() {
    return this.story.order
  }

  get tags(): aux.Tags<A> {
    return this.story.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.story.links ?? []
  }

  get projectId() {
    return this.model.projectId
  }

  get $view(): AnyStoryView<A> {
    return this.story
  }

  /**
   * Flattened scene list in traversal order.
   * Only present once the story is computed/layouted; empty for a still-parsed story.
   */
  get scenes(): ReadonlyArray<ComputedStoryScene<A>> {
    const story = this.story
    if (isOnStage(story, 'computed') || isOnStage(story, 'layouted')) {
      return story.scenes
    }
    return []
  }

  /**
   * Tree structure preserving `alt` blocks, for the outline panel.
   * Only present once the story is computed/layouted; empty for a still-parsed story.
   */
  get storyFlow(): ReadonlyArray<AnyStoryStatement<A>> {
    const story = this.story
    if (isOnStage(story, 'computed') || isOnStage(story, 'layouted')) {
      return story.storyFlow
    }
    return []
  }
}
