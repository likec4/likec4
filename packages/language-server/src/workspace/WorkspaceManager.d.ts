import type { BuildOptions, Cancellation, FileSelector, FileSystemNode, LangiumDocument, LangiumDocumentFactory } from 'langium';
import { DefaultWorkspaceManager, Disposable } from 'langium';
import type { WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import type { FileSystemProvider } from '../filesystem';
import type { LikeC4SharedServices } from '../module';
export declare class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
    #private;
    private services;
    protected readonly documentFactory: LangiumDocumentFactory;
    protected readonly fileSystemProvider: FileSystemProvider;
    initialBuildOptions: BuildOptions;
    constructor(services: LikeC4SharedServices);
    /**
     * First load all project config files, then load all documents in the workspace.
     */
    protected performStartup(folders: WorkspaceFolder[]): Promise<LangiumDocument[]>;
    /**
     * Load all additional documents that shall be visible in the context of the given workspace
     * folders and add them to the collector. This can be used to include built-in libraries of
     * your language, which can be either loaded from provided files or constructed in memory.
     */
    protected loadAdditionalDocuments(folders: WorkspaceFolder[], collector: (document: LangiumDocument) => void): Promise<void>;
    /**
     * Determine whether the given folder entry shall be included while indexing the workspace.
     */
    protected includeEntry(_: WorkspaceFolder, entry: FileSystemNode, selector: FileSelector): boolean;
    workspace(): WorkspaceFolder | null;
    rebuildAll(cancelToken?: Cancellation.CancellationToken): Promise<void>;
    get workspaceUri(): URI;
    get workspaceURL(): URL;
    /**
     * Force clean all caches
     */
    forceCleanCaches(): void;
    /**
     * Register a listener to be called when caches are force cleaned
     */
    onForceCleanCache(listener: () => void): Disposable;
}
