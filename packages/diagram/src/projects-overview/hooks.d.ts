import type { ProjectsOverviewXYFLowInstance, ProjectsOverviewXYStoreApi } from './_types';
import type { ProjectsOverviewSnapshot } from './actor';
export declare function useProjectsOverviewState<T>(selector: (state: ProjectsOverviewSnapshot) => T, compare?: (a: T, b: T) => boolean): T;
export declare function useProjectsOverviewXYFlow(): ProjectsOverviewXYFLowInstance;
export declare function useProjectsOverviewXYStoreApi(): ProjectsOverviewXYStoreApi;
