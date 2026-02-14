import { type IncludeConfig, type LikeC4ProjectConfig, type LikeC4ProjectConfigInput } from '@likec4/config';
import type { NonEmptyArray, NonEmptyReadonlyArray } from '@likec4/core';
import type { ProjectId } from '@likec4/core/types';
import { type Cancellation, type LangiumDocument, Disposable, URI } from 'langium';
import type { Tagged } from 'type-fest';
import type { LikeC4SharedServices } from '../module';
export type NormalizedUri = Tagged<string, 'NormalizedUri'>;
type DocOrUri = LangiumDocument | string | URI;
/**
 * A tagged string that represents a project folder URI
 * Always has trailing slash.
 */
export type ProjectFolder = Tagged<string, 'ProjectFolder'>;
export declare function ProjectFolder(folder: URI | string): ProjectFolder;
export interface Project {
    id: ProjectId;
    folderUri: URI;
    config: LikeC4ProjectConfig;
}
export interface ProjectData extends Project {
    id: ProjectId;
    folder: ProjectFolder;
    config: LikeC4ProjectConfig;
    configUri: URI;
    folderUri: URI;
    exclude?: {
        (test: string): boolean;
    };
    /**
     * Resolved include paths with both URI and folder string representations.
     * These are additional directories that are part of this project.
     */
    includePaths?: NonEmptyArray<{
        uri: URI;
        folder: ProjectFolder;
    }>;
    /**
     * Normalized include configuration (paths, maxDepth, fileThreshold).
     */
    includeConfig: IncludeConfig;
}
type RegisterProjectOptions = {
    config: LikeC4ProjectConfig | LikeC4ProjectConfigInput;
} & ({
    configUri: URI | string;
} | {
    folderUri: URI | string;
});
export declare class ProjectsManager {
    #private;
    protected services: LikeC4SharedServices;
    /**
     * The global project ID used for all documents
     * that are not part of a specific project.
     */
    static readonly DefaultProjectId: ProjectId;
    constructor(services: LikeC4SharedServices);
    /**
     * Returns:
     *  - configured default project ID if set
     *  - the default project ID if there are no projects.
     *  - the ID of the only project
     *  - undefined if there are multiple projects.
     */
    get defaultProjectId(): ProjectId | undefined;
    set defaultProjectId(id: string | ProjectId | undefined);
    get default(): ProjectData;
    get all(): NonEmptyReadonlyArray<ProjectId>;
    getProject(arg: ProjectId | LangiumDocument): ProjectData;
    /**
     * Returns all projects that overlap with the specified folder (is parent or child)
     */
    findOverlaped(folder: URI | string): ProjectData[];
    /**
     * Validates and ensures the project ID.
     * If no project ID is specified, returns default project ID
     * If there are multiple projects and default project is not set, throws an error
     */
    ensureProjectId(projectId?: ProjectId | undefined): ProjectId;
    /**
     * Validates and ensures the project.
     */
    ensureProject(projectId?: ProjectId | undefined): ProjectData;
    hasMultipleProjects(): boolean;
    /**
     * Checks if the specified document should be excluded from processing.
     */
    isExcluded(document: DocOrUri): boolean;
    isExcluded(projectId: ProjectId, document: DocOrUri): boolean;
    /**
     * Checks if the specified document is included by the project:
     * - if the document belongs to the project and is not excluded
     * - if the document is included by the project
     */
    isIncluded(projectId: ProjectId, document: LangiumDocument | URI | string): boolean;
    /**
     * Registers likec4 project by config file.
     */
    registerConfigFile(configUri: URI, cancelToken?: Cancellation.CancellationToken): Promise<ProjectData>;
    /**
     * Registers (or reloads) likec4 project by config file or config object.
     * If there is some project registered at same folder, it will be reloaded.
     */
    registerProject(opts: RegisterProjectOptions, cancelToken?: Cancellation.CancellationToken): Promise<ProjectData>;
    /**
     * Determines which project the given document belongs to.
     * If the document does not belong to any project, returns the default project ID.
     */
    ownerProjectId(document: LangiumDocument | URI | string): ProjectId;
    reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void>;
    protected _reloadProjects(cancelToken?: Cancellation.CancellationToken): Promise<void>;
    protected uniqueProjectId(name: string): ProjectId;
    protected resetCaches(): void;
    rebuildProject(projectId: ProjectId, cancelToken?: Cancellation.CancellationToken): Promise<void>;
    /**
     * Returns all include paths from all projects.
     * Used by WorkspaceManager to scan additional directories for C4 files.
     */
    getAllIncludePaths(): Array<{
        projectId: ProjectId;
        includePath: URI;
        includeConfig: IncludeConfig;
    }>;
    /**
     * Register a listener to be called when the projects configuration has changed.
     * @returns A disposable that can be used to unregister the callback.
     */
    onProjectsUpdate(callback: () => void): Disposable;
    private getWorkspaceFolder;
    private notifyListeners;
    private updateIncludesExcludes;
}
export {};
