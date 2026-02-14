import type { LikeC4Project, ProjectId } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
import type { JSX } from 'react/jsx-runtime';
export interface LikeC4ProjectsProviderProps {
    /**
     * Projects to be used in the navigation panel.
     * Current project is taken from the LikeC4Model
     */
    projects: ReadonlyArray<LikeC4Project>;
    /**
     * Optional callback when another project is selected.
     */
    onProjectChange?: (id: ProjectId) => void;
}
/**
 * Ensures LikeC4Projects context
 */
export declare function LikeC4ProjectsProvider({ children, projects, onProjectChange: _onProjectChange, }: PropsWithChildren<LikeC4ProjectsProviderProps>): JSX.Element;
