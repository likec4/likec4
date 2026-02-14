import { type ProjectId, Fqn } from '@likec4/core/types';
import { DefaultWeakMap, MultiMap } from '@likec4/core/utils';
import { type Stream, WorkspaceCache } from 'langium';
import { type AstNodeDescriptionWithFqn, type LikeC4LangiumDocument, ast } from '../ast';
import type { LikeC4Services } from '../module';
import { ADisposable } from '../utils';
import { type LangiumDocuments, ProjectsManager } from '../workspace';
export declare class FqnIndex<AstNd = ast.Element> extends ADisposable {
    protected services: LikeC4Services;
    protected projects: ProjectsManager;
    protected langiumDocuments: LangiumDocuments;
    protected documentCache: DefaultWeakMap<LikeC4LangiumDocument, DocumentFqnIndex>;
    protected workspaceCache: WorkspaceCache<string, AstNodeDescriptionWithFqn[]>;
    protected logger: any;
    constructor(services: LikeC4Services);
    private documents;
    get(document: LikeC4LangiumDocument): DocumentFqnIndex;
    resolve(reference: ast.Referenceable): Fqn;
    getFqn(el: AstNd): Fqn;
    byFqn(projectId: ProjectId, fqn: Fqn): Stream<AstNodeDescriptionWithFqn>;
    rootElements(projectId: ProjectId): Stream<AstNodeDescriptionWithFqn>;
    directChildrenOf(projectId: ProjectId, parent: Fqn): Stream<AstNodeDescriptionWithFqn>;
    /**
     * Returns descedant elements with unique names in the scope
     */
    uniqueDescedants(projectId: ProjectId, parent: Fqn): Stream<AstNodeDescriptionWithFqn>;
    protected createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex;
}
export declare class DocumentFqnIndex {
    private _rootElements;
    /**
     * direct children of elements
     */
    private _children;
    /**
     * All descendants of an element (unique by name)
     */
    private _descendants;
    /**
     * All elements by FQN
     */
    private _byfqn;
    readonly projectId: ProjectId;
    static readonly EMPTY: DocumentFqnIndex;
    constructor(_rootElements: Array<AstNodeDescriptionWithFqn>, 
    /**
     * direct children of elements
     */
    _children: MultiMap<Fqn, AstNodeDescriptionWithFqn>, 
    /**
     * All descendants of an element (unique by name)
     */
    _descendants: MultiMap<Fqn, AstNodeDescriptionWithFqn>, 
    /**
     * All elements by FQN
     */
    _byfqn: MultiMap<Fqn, AstNodeDescriptionWithFqn>, projectId: ProjectId);
    rootElements(): readonly AstNodeDescriptionWithFqn[];
    byFqn(fqn: Fqn): readonly AstNodeDescriptionWithFqn[];
    children(parent: Fqn): readonly AstNodeDescriptionWithFqn[];
    descendants(nodeName: Fqn): readonly AstNodeDescriptionWithFqn[];
}
