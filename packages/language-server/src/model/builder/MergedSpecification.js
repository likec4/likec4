import { assignTagColors } from '@likec4/core/styles';
import { exact, FqnRef } from '@likec4/core/types';
import { isNonEmptyArray, MultiMap, nameFromFqn } from '@likec4/core/utils';
import { isEmpty, isEmptyish, isNonNullish, unique, } from 'remeda';
import { logger, logWarnError } from '../../logger';
/**
 * The `MergedSpecification` class is responsible for merging multiple parsed
 * LikeC4Langium documents into a single specification. It consolidates tags,
 * elements, deployments, relationships, and colors from the provided documents
 * and provides methods to convert parsed models into C4 model elements and relations.
 */
export class MergedSpecification {
    specs = {
        elements: {},
        deployments: {},
        relationships: {},
        colors: {},
    };
    tags;
    globals = {
        predicates: {},
        dynamicPredicates: {},
        styles: {},
    };
    imports = new MultiMap(Set);
    constructor(docs) {
        const tags = {};
        for (const doc of docs) {
            const { c4Specification: spec, c4Globals, c4Imports, } = doc;
            Object.assign(tags, spec.tags);
            Object.assign(this.specs.elements, spec.elements);
            Object.assign(this.specs.relationships, spec.relationships);
            Object.assign(this.specs.colors, spec.colors);
            Object.assign(this.specs.deployments, spec.deployments);
            Object.assign(this.globals.predicates, c4Globals.predicates);
            Object.assign(this.globals.dynamicPredicates, c4Globals.dynamicPredicates);
            Object.assign(this.globals.styles, c4Globals.styles);
            for (const [projectId, fqn] of c4Imports) {
                this.imports.set(projectId, fqn);
            }
        }
        this.tags = assignTagColors(tags);
    }
    /**
     * Converts a parsed model into a C4 model element.
     */
    toModelElement = ({ tags, links, style, id, kind, title, description, technology, summary, metadata, }) => {
        try {
            const __kind = this.specs.elements[kind];
            if (!__kind) {
                logger.warn `No kind '${kind}' found for ${id}`;
                return null;
            }
            technology ??= __kind.technology;
            description ??= __kind.description;
            summary ??= __kind.summary;
            links ??= __kind.links;
            if (isEmptyish(title)) {
                title = __kind.title || nameFromFqn(id);
            }
            if (__kind.tags && isNonEmptyArray(__kind.tags)) {
                tags = tags
                    ? unique([
                        ...__kind.tags,
                        ...tags,
                    ])
                    : __kind.tags;
            }
            return exact({
                metadata: metadata && !isEmpty(metadata) ? metadata : undefined,
                notation: __kind.notation,
                style: exact({
                    ...__kind.style,
                    ...style,
                }),
                links,
                tags,
                summary,
                technology,
                description,
                title,
                kind,
                id,
            });
        }
        catch (e) {
            logWarnError(e);
        }
        return null;
    };
    /**
     * Converts a parsed model into a C4 model relation.
     */
    toModelRelation = ({ astPath: _astPath, // omit
    source, target, kind, links, id, ...model }) => {
        if (isNonNullish(kind) && this.specs.relationships[kind]) {
            return {
                ...this.specs.relationships[kind],
                ...model,
                ...(links && { links }),
                source,
                target,
                kind,
                id,
            };
        }
        return {
            ...(links && { links }),
            ...model,
            source,
            target,
            id,
        };
    };
    /**
     * Converts a parsed deployment model into a C4 deployment model
     */
    toDeploymentElement = (parsed) => {
        if ('element' in parsed && !('kind' in parsed)) {
            return {
                ...parsed,
                element: FqnRef.flatten(parsed.element),
            };
        }
        if ('element' in parsed) {
            logger.warn `Invalid ParsedAstDeployment ${parsed.id}, has both element and kind properties`;
            return null;
        }
        try {
            const __kind = this.specs.deployments[parsed.kind];
            if (!__kind) {
                logger.warn `No kind ${parsed.kind} found for ${parsed.id}`;
                return null;
            }
            let { id, style, title, ...rest } = parsed;
            title = title === nameFromFqn(parsed.id) && __kind.title ? __kind.title : title;
            return exact({
                ...__kind,
                ...rest,
                title,
                style: exact({
                    ...__kind.style,
                    ...style,
                }),
                id,
            });
        }
        catch (e) {
            logWarnError(e);
        }
        return null;
    };
    /**
     * Converts a parsed deployment relation into a C4 deployment relation.
     */
    toDeploymentRelation = ({ astPath: _astPath, // omit
    source, target, kind, links, id, ...model }) => {
        if (isNonNullish(kind) && this.specs.relationships[kind]) {
            return {
                ...this.specs.relationships[kind],
                ...model,
                ...(links && { links }),
                source,
                target,
                kind,
                id,
            };
        }
        return {
            ...(links && { links }),
            ...model,
            source,
            target,
            id,
        };
    };
}
