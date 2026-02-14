import type { NonEmptyArray, ProjectId } from '@likec4/core';
import type { LangiumDocument, Stream, URI } from 'langium';
import { DefaultLangiumDocuments } from 'langium';
import { type LikeC4LangiumDocument } from '../ast';
import type { LikeC4SharedServices } from '../module';
import type { ProjectsManager } from './ProjectsManager';
export declare class LangiumDocuments extends DefaultLangiumDocuments {
    protected services: LikeC4SharedServices;
    constructor(services: LikeC4SharedServices);
    protected get projectsManager(): ProjectsManager;
    addDocument(document: LangiumDocument): void;
    getDocument(uri: URI): LangiumDocument | undefined;
    /**
     * Returns all user documents
     */
    get userDocuments(): Stream<LikeC4LangiumDocument>;
    /**
     * Returns all documents (ensures project IDs are set)
     */
    get all(): Stream<LangiumDocument>;
    /**
     * Returns all documents for a project, including both project documents and documents included by the project.
     */
    projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument>;
    groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>>;
    /**
     * Reset the project IDs of all documents.
     * Returns the URIs
     */
    resetProjectIds(): URI[];
}
