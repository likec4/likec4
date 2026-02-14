import { LikeC4Model } from '../../model/LikeC4Model';
import { type NonEmptyArray } from '../../types';
import type { ComputedProjectsView } from './_types';
/**
 * Computes an overview of projects and their relationships
 */
export declare function computeProjectsView(likec4models: NonEmptyArray<LikeC4Model>): ComputedProjectsView;
