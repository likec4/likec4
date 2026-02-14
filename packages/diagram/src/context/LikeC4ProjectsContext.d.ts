import type { LikeC4Project, ProjectId } from '@likec4/core/types';
export type LikeC4ProjectsContext = {
    projects: ReadonlyArray<LikeC4Project>;
    onProjectChange: (id: ProjectId) => void;
};
export declare const LikeC4ProjectsContextProvider: import("react").Provider<LikeC4ProjectsContext>;
export declare function useOptionalProjectsContext(): LikeC4ProjectsContext | null;
