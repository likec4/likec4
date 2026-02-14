import type { LikeC4Project, ProjectId } from '@likec4/core/types';
import { type LikeC4ProjectsContext } from '../context/LikeC4ProjectsContext';
export declare function useLikeC4ProjectsContext(): LikeC4ProjectsContext;
/**
 * @returns The list of available projects, or empty array if no projects are available.
 */
export declare function useLikeC4Projects(): ReadonlyArray<LikeC4Project>;
/**
 * @returns The callback to change current project, or a no-op if no LikeC4ProjectsProvider is found.
 */
export declare function useChangeLikeC4Project(): (id: ProjectId) => void;
/**
 * @returns True if there are more than one project available in the context.
 */
export declare function useHasProjects(): boolean;
/**
 * @returns Current project id, as provided by LikeC4Model
 */
export declare function useLikeC4ProjectId(): ProjectId;
/**
 * Returns current LikeC4 project.
 * Requires LikeC4ModelProvider in the tree.
 * Falls back to model's project if LikeC4ProjectsProvider is not available.
 */
export declare function useLikeC4Project(): LikeC4Project;
