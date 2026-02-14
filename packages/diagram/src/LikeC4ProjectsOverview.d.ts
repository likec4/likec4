import type { JSX } from 'react/jsx-runtime';
import type { Simplify } from 'type-fest';
import { type ProjectsOverviewProps } from './projects-overview';
export type LikeC4ProjectsOverviewProps = Simplify<ProjectsOverviewProps & {
    className?: string;
    onSelectProject?: ProjectsOverviewProps['onNavigateToProject'];
}>;
export declare function LikeC4ProjectsOverview({ view, className, onNavigateToProject, ...props }: LikeC4ProjectsOverviewProps): JSX.Element;
