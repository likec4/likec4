import type { LayoutedView, ProjectId, ViewId } from '@likec4/core';
import { SimpleCache, URI } from 'langium';
import { type Location } from 'vscode-languageserver-types';
import type { LikeC4SharedServices } from '../module';
import type { Project } from '../workspace/ProjectsManager';
import type { LikeC4ManualLayouts, LikeC4ManualLayoutsModuleContext, ManualLayoutsSnapshot } from './types';
/**
 * @todo sync with vscode extension watchers
 *       (search for ".likec4.snap" references)
 */
export declare const isManualLayoutFile: (path: string) => boolean;
export declare const WithLikeC4ManualLayouts: LikeC4ManualLayoutsModuleContext;
export declare class DefaultLikeC4ManualLayouts implements LikeC4ManualLayouts {
    private services;
    protected cache: SimpleCache<ProjectId, Promise<ManualLayoutsSnapshot | null>>;
    constructor(services: LikeC4SharedServices);
    read(project: Project): Promise<ManualLayoutsSnapshot | null>;
    write(project: Project, layouted: LayoutedView): Promise<Location>;
    remove(project: Project, view: ViewId): Promise<Location | null>;
    clearCaches(): void;
    /**
     * When we save snapshot - it may contain fullpath to icons on the machine it was created,
     * that is wrong when opened on another.
     *
     * Prepares a snapshot for writing by converting absolute icon paths to relative paths.
     * Absolute paths starting with 'file://' are converted to relative paths prefixed with 'file://./'
     */
    protected normalizeIconPathsForWrite(layouted: LayoutedView, projectUri: URI): LayoutedView;
    /**
     * Postprocesses a snapshot after reading by converting relative icon paths back to absolute paths.
     * Relative paths prefixed with 'file://./' are converted to absolute paths based on project folder.
     */
    protected resolveIconPathsAfterRead(layouted: LayoutedView, projectUri: URI): LayoutedView;
}
