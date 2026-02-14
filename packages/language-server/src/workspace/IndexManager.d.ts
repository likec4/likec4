import type { ProjectId } from '@likec4/core';
import { type AstNodeDescription, type LangiumDocument, type Stream, DefaultIndexManager } from 'langium';
import type { CancellationToken } from 'vscode-languageserver';
import type { LikeC4SharedServices } from '../module';
export declare class IndexManager extends DefaultIndexManager {
    protected services: LikeC4SharedServices;
    constructor(services: LikeC4SharedServices);
    updateContent(document: LangiumDocument, cancelToken?: CancellationToken): Promise<void>;
    projectElements(projectId: ProjectId, nodeType?: string, uris?: Set<string>): Stream<AstNodeDescription>;
}
