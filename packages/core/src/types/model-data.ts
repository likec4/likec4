import type { IsAny } from 'type-fest'
import type * as aux from './_aux'
import type {
  Any,
  AnyComputed,
  AnyLayouted,
  AnyParsed,
  UnknownComputed,
  UnknownLayouted,
  UnknownParsed,
} from './_aux'
import type { NonEmptyArray } from './_common'
import type { _stage } from './const'
import type { ModelGlobals } from './global'
import type { DeploymentElement, DeploymentRelationship } from './model-deployment'
import type { Element, Relationship } from './model-logical'
import type { Specification } from './model-spec'
import type { LikeC4Project } from './project'
import type * as scalar from './scalar'
import type { ComputedView, LayoutedView, ParsedView } from './view'
import type { ViewManualLayoutSnapshot } from './view-manual-layout'

/**
 * Represents a LikeC4 model data, in different stages of processing
 * - {@link ParsedLikeC4ModelData} - parsed from DSL or result from Builder
 * - {@link ComputedLikeC4ModelData} - computed from parsed model
 * - {@link LayoutedLikeC4ModelData} - layouted from computed model
 *
 * !IMPORTANT: This is a low-level type, use `LikeC4Model` instead.
 */
interface BaseLikeC4ModelData<A extends Any> {
  [_stage]: A['Stage']
  projectId: aux.ProjectId<A>
  project: LikeC4Project
  specification: Specification<A>
  elements: Record<aux.ElementId<A>, Element<A>>
  deployments: {
    elements: Record<aux.DeploymentId<A>, DeploymentElement<A>>
    relations: Record<scalar.RelationId, DeploymentRelationship<A>>
  }
  relations: Record<scalar.RelationId, Relationship<A>>
  globals: ModelGlobals
  imports: Record<string, NonEmptyArray<Element<A>>>
  /**
   * If project contains saved manual layouts
   * This is not set for {@link ParsedLikeC4ModelData}
   */
  // manualLayouts?: Record<scalar.ViewId, ViewManualLayoutSnapshot>
}

export type AuxFromLikeC4ModelData<D> =
  // dprint-ignore
  D extends BaseLikeC4ModelData<infer A extends Any>
    ? IsAny<A> extends true
      ? never
      : A
    : never

export interface ParsedLikeC4ModelData<A extends AnyParsed = UnknownParsed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'parsed'
  views: Record<aux.ViewId<A>, ParsedView<A>>
}

export interface ComputedLikeC4ModelData<A extends AnyComputed = UnknownComputed> extends BaseLikeC4ModelData<A> {
  [_stage]: 'computed'
  views: Record<aux.ViewId<A>, ComputedView<A>>
  /**
   * If project contains saved manual layouts
   */
  manualLayouts?: Record<scalar.ViewId, ViewManualLayoutSnapshot>
}

export interface LayoutedLikeC4ModelData<A extends AnyLayouted = UnknownLayouted> extends BaseLikeC4ModelData<A> {
  [_stage]: 'layouted'
  // globals: ModelGlobals<A>
  views: Record<aux.ViewId<A>, LayoutedView<A>>
  /**
   * If this model contains saved manual layouts
   */
  manualLayouts?: Record<scalar.ViewId, ViewManualLayoutSnapshot>
}

export type LikeC4ModelData<A extends Any> =
  | ParsedLikeC4ModelData<A>
  | ComputedLikeC4ModelData<A>
  | LayoutedLikeC4ModelData<A>
