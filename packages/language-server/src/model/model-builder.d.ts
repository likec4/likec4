import { type ProjectId, type UnknownComputed, type UnknownParsed } from '@likec4/core';
import { LikeC4Model } from '@likec4/core/model';
import type * as c4 from '@likec4/core/types';
import { type URI, Disposable } from 'langium';
import type { CancellationToken } from 'vscode-jsonrpc';
import type { ManualLayoutsSnapshot } from '../filesystem';
import type { LikeC4Services } from '../module';
import { ADisposable } from '../utils';
type ModelParsedListener = (docs: URI[]) => void;
export interface LikeC4ModelBuilder extends Disposable {
    parseModel(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownParsed> | null>;
    unsafeSyncComputeModel(projectId: ProjectId): LikeC4Model<UnknownComputed>;
    computeModel(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownComputed>>;
    onModelParsed(callback: ModelParsedListener): Disposable;
    clearCache(): void;
}
export declare class DefaultLikeC4ModelBuilder extends ADisposable implements LikeC4ModelBuilder {
    private projects;
    private parser;
    private listeners;
    private cache;
    private DocumentBuilder;
    private manualLayouts;
    private mutex;
    constructor(services: LikeC4Services);
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * To avoid circular dependencies, we do not resolve imports here.
     */
    private unsafeSyncParseModelData;
    /**
     * To avoid circular dependencies, first we parse all documents and then we join them.
     */
    private unsafeSyncJoinedModelData;
    parseModel(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownParsed>>;
    private previousViews;
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * @internal
     */
    unsafeSyncComputeModel(projectId: c4.ProjectId, manualLayouts?: ManualLayoutsSnapshot | null): LikeC4Model<UnknownComputed>;
    computeModel(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownComputed>>;
    onModelParsed(callback: ModelParsedListener): Disposable;
    clearCache(): void;
    private documents;
    private notifyListeners;
}
export {};
