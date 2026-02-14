import type * as c4 from '@likec4/core';
import { type MultiMap } from '@likec4/core';
import type { ParsedLikeC4LangiumDocument } from '../../ast';
import type { Project } from '../../workspace/ProjectsManager';
export type BuildModelData = {
    data: c4.ParsedLikeC4ModelData;
    imports: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>>;
};
/**
 * Each document was parsed into a ParsedLikeC4LangiumDocument, where elements
 * do not inherit styles from specification.
 *
 * This function builds a model from all documents, merging the specifications
 * and globals, and applying the extends to the elements.
 */
export declare function buildModelData(project: Project, docs: ReadonlyArray<ParsedLikeC4LangiumDocument>): BuildModelData;
