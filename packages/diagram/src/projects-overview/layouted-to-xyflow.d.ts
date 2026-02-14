import type { LayoutedProjectsView } from '@likec4/core/compute-view';
import type { ProjectsOverviewTypes } from './_types';
export declare function layoutedProjectsViewToXYFlow(view: LayoutedProjectsView): {
    xynodes: ProjectsOverviewTypes.Node[];
    xyedges: ProjectsOverviewTypes.Edge[];
};
