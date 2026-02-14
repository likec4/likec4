import { isDeepEqual, isNullish, isTruthy, only, pick, pickBy, pipe, reduce, unique } from 'remeda';
import { exact, } from '../../types';
import { isNonEmptyArray } from '../../utils';
function pickRelationshipProps(relation) {
    const { title, description = null, } = relation;
    return {
        // Pick description only if title is present
        ...(title && {
            title,
            description,
        }),
        ...pick(relation, ['color', 'technology', 'head', 'line', 'tail', 'kind', 'navigateTo']),
    };
}
/**
 * Merges properties from multiple relationships into a single object.
 * @param relations - The relationships to merge.
 * @param prefer - The relationship to prefer when merging.
 */
export function mergePropsFromRelationships(relations, prefer) {
    const allprops = pipe(relations, reduce((acc, r) => {
        if (isTruthy(r.title) && !acc.title.includes(r.title)) {
            acc.title.push(r.title);
        }
        if (isTruthy(r.description) && !acc.description.some(isDeepEqual(r.description))) {
            acc.description.push(r.description);
        }
        if (isTruthy(r.technology) && !acc.technology.includes(r.technology)) {
            acc.technology.push(r.technology);
        }
        if (isTruthy(r.kind) && !acc.kind.includes(r.kind)) {
            acc.kind.push(r.kind);
        }
        if (isTruthy(r.color) && !acc.color.includes(r.color)) {
            acc.color.push(r.color);
        }
        if (isTruthy(r.line) && !acc.line.includes(r.line)) {
            acc.line.push(r.line);
        }
        if (isTruthy(r.head) && !acc.head.includes(r.head)) {
            acc.head.push(r.head);
        }
        if (isTruthy(r.tail) && !acc.tail.includes(r.tail)) {
            acc.tail.push(r.tail);
        }
        if (isTruthy(r.navigateTo) && !acc.navigateTo.includes(r.navigateTo)) {
            acc.navigateTo.push(r.navigateTo);
        }
        if (r.tags) {
            acc.tags.push(...r.tags);
        }
        return acc;
    }, {
        title: [],
        description: [],
        technology: [],
        kind: [],
        head: [],
        tail: [],
        color: [],
        tags: [],
        line: [],
        navigateTo: [],
    }));
    let title = only(allprops.title) ?? (allprops.title.length > 1 ? '[...]' : undefined);
    const tags = unique(allprops.tags);
    let merged = exact({
        title,
        description: only(allprops.description),
        technology: only(allprops.technology),
        kind: only(allprops.kind),
        head: only(allprops.head),
        tail: only(allprops.tail),
        color: only(allprops.color),
        line: only(allprops.line),
        navigateTo: only(allprops.navigateTo),
        ...isNonEmptyArray(tags) && { tags },
    });
    if (prefer) {
        const preferred = pickRelationshipProps(prefer);
        merged = pickBy({
            ...merged,
            ...preferred,
        }, isTruthy);
    }
    // If after merging title is still null, but technology is present, set title to technology
    if (isNullish(merged.title) && isTruthy(merged.technology)) {
        merged.title = `[${merged.technology}]`;
        delete merged.technology;
    }
    return merged;
}
