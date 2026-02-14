import type * as c4 from '@likec4/core';
import { MultiMap } from '@likec4/core/utils';
import type { ParsedAstDeployment, ParsedAstDeploymentRelation, ParsedAstElement, ParsedAstRelation, ParsedAstSpecification, ParsedLikeC4LangiumDocument } from '../../ast';
/**
 * The `MergedSpecification` class is responsible for merging multiple parsed
 * LikeC4Langium documents into a single specification. It consolidates tags,
 * elements, deployments, relationships, and colors from the provided documents
 * and provides methods to convert parsed models into C4 model elements and relations.
 */
export declare class MergedSpecification {
    readonly specs: Omit<ParsedAstSpecification, 'tags'>;
    readonly tags: Readonly<Record<c4.Tag, c4.TagSpecification>>;
    readonly globals: c4.ModelGlobals;
    readonly imports: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>>;
    constructor(docs: ReadonlyArray<ParsedLikeC4LangiumDocument>);
    /**
     * Converts a parsed model into a C4 model element.
     */
    toModelElement: ({ tags, links, style, id, kind, title, description, technology, summary, metadata, }: ParsedAstElement) => c4.Element | null;
    /**
     * Converts a parsed model into a C4 model relation.
     */
    toModelRelation: ({ astPath: _astPath, source, target, kind, links, id, ...model }: ParsedAstRelation) => c4.Relationship | null;
    /**
     * Converts a parsed deployment model into a C4 deployment model
     */
    toDeploymentElement: (parsed: ParsedAstDeployment) => c4.DeploymentElement | null;
    /**
     * Converts a parsed deployment relation into a C4 deployment relation.
     */
    toDeploymentRelation: ({ astPath: _astPath, source, target, kind, links, id, ...model }: ParsedAstDeploymentRelation) => c4.DeploymentRelationship | null;
}
