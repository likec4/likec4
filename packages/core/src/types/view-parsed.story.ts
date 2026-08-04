import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { ExclusiveUnion, NonEmptyReadonlyArray } from './_common'
import { _type } from './const'
import * as scalar from './scalar'
import type { BaseParsedViewProperties } from './view-common'

/**
 * N→M element correspondence across a scene transition.
 * `a becomes b, c` splits; `a, b becomes c` merges; `a becomes b` renames.
 */
export interface StoryCorrespondence<A extends AnyAux = AnyAux> {
  readonly sources: NonEmptyReadonlyArray<aux.StrictFqn<A>>
  readonly targets: NonEmptyReadonlyArray<aux.StrictFqn<A>>
}

export interface StoryScene<A extends AnyAux = AnyAux> {
  /**
   * The view this scene renders. Never a story — nested stories are rejected by validation.
   */
  readonly view: aux.StrictViewId<A>
  readonly title?: string | null
  readonly description?: scalar.MarkdownOrString
  /**
   * Narration shown in the walkthrough panel.
   */
  readonly notes?: scalar.MarkdownOrString
  readonly becomes?: StoryCorrespondence<A>[]
  /**
   * The element that should stay visually still when arriving at this scene,
   * if the author declared one. Resolved by `packages/diagram` at render time
   * against whatever was on screen before this scene — see
   * `docs/superpowers/specs/2026-08-04-story-scene-anchor-design.md`.
   */
  readonly anchor?: aux.StrictFqn<A>
  /**
   * Path to the AST node relative to the view body ast.
   * Used to locate the scene in the source code. Mirrors `Step.astPath`.
   */
  readonly astPath: string
}

/**
 * Block kinds a story may contain. Only `alt` and its branches are implemented;
 * the rest are parsed and rejected by validation. `parallel` normalises to `par`.
 */
export type StorySubflowKind = 'opt' | 'par' | 'loop' | 'break'
export type StoryAltBranchKind = 'when' | 'if' | 'else'

export interface StorySubflow<A extends AnyAux = AnyAux> {
  readonly [_type]: StorySubflowKind
  readonly title?: string
  readonly statements: NonEmptyReadonlyArray<AnyStoryStatement<A>>
}

export interface StoryAltBranch<A extends AnyAux = AnyAux> {
  readonly [_type]: StoryAltBranchKind
  readonly title?: string
  readonly statements: NonEmptyReadonlyArray<AnyStoryStatement<A>>
}

export interface StoryAlt<A extends AnyAux = AnyAux> {
  readonly [_type]: 'alt'
  readonly title?: string
  readonly branches: NonEmptyReadonlyArray<StoryAltBranch<A>>
}

export type AnyStoryStatement<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Scene: StoryScene<A>
  Alt: StoryAlt<A>
  Subflow: StorySubflow<A>
}>

export const storyGuards = {
  isScene: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StoryScene<A> => {
    return !!s && 'view' in s
  },
  isAlt: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StoryAlt<A> => {
    return !!s && _type in s && s[_type] === 'alt'
  },
  isSubflow: <A extends AnyAux>(s: AnyStoryStatement<A> | undefined | null): s is StorySubflow<A> => {
    return !!s && _type in s && s[_type] !== 'alt'
  },
}

export interface ParsedStoryView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'story'
  readonly statements: AnyStoryStatement<A>[]
}
