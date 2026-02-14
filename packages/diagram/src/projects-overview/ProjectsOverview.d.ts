import type { ProjectId } from '@likec4/core';
import type { LayoutedProjectsView } from '@likec4/core/compute-view';
import type { ViewPadding } from '../LikeC4Diagram.props';
import { type ProjectsOverviewXYProps } from './ProjectsOverviewXY';
export type ProjectsOverviewProps = {
    view: LayoutedProjectsView;
    /**
     * Callback when project is selected (e.g. clicked)
     */
    onNavigateToProject?: undefined | ((projectId: ProjectId) => void);
    fitViewPadding?: ViewPadding | undefined;
} & ProjectsOverviewXYProps;
export declare function ProjectsOverview({ view, onNavigateToProject, fitViewPadding, ...props }: ProjectsOverviewProps): import("react").JSX.Element;
