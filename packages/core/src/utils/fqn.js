import { hasAtLeast } from 'remeda';
import { isString } from '../types/guards';
import { compareNatural } from './compare-natural';
export function parentFqn(fqn) {
    const lastDot = fqn.lastIndexOf('.');
    if (lastDot > 0) {
        return fqn.slice(0, lastDot);
    }
    return null;
}
export function parentFqnPredicate(parent) {
    const prefix = parent + '.';
    return (e) => !!e.parent && (e.parent === parent || e.parent.startsWith(prefix));
}
export function nameFromFqn(fqn) {
    const lastDot = fqn.lastIndexOf('.');
    if (lastDot > 0) {
        return fqn.slice(lastDot + 1);
    }
    else {
        return fqn;
    }
}
const asString = e => (isString(e) ? e : e.id);
export function isAncestor(arg1, arg2) {
    const arg1Id = asString(arg1);
    if (arg2) {
        const arg2Id = asString(arg2);
        return arg2Id.startsWith(arg1Id + '.');
    }
    return (ancestor) => {
        const ancestorId = asString(ancestor);
        return arg1Id.startsWith(ancestorId + '.');
    };
}
export function isSameHierarchy(one, another) {
    if (!another) {
        return (b) => isSameHierarchy(one, b);
    }
    const first = asString(one);
    const second = asString(another);
    return first === second || second.startsWith(first + '.') || first.startsWith(second + '.');
}
export function isDescendantOf(descedant, ancestor) {
    if (!ancestor) {
        return (d) => isAncestor(descedant, d);
    }
    return isAncestor(ancestor, descedant);
}
/**
 * How deep in the hierarchy the element is.
 * Root element has depth 1
 */
export function hierarchyLevel(elementOfFqn) {
    const first = isString(elementOfFqn) ? elementOfFqn : elementOfFqn.id;
    return first.split('.').length;
}
/**
 * Calculate the distance as number of steps from one element to another, i.e.
 * going up to the common ancestor, then going down to the other element.
 * Sibling distance is always 1
 *
 * Can be used for hierarchical clustering
 */
export function hierarchyDistance(one, another) {
    const first = isString(one) ? one : one.id;
    const second = isString(another) ? another : another.id;
    if (first === second) {
        return 0;
    }
    const firstDepth = hierarchyLevel(first);
    const secondDepth = hierarchyLevel(second);
    if (isSameHierarchy(first, second)) {
        return Math.abs(firstDepth - secondDepth);
    }
    const ancestor = commonAncestor(first, second);
    const ancestorDepth = ancestor ? hierarchyLevel(ancestor) : 0;
    return firstDepth + secondDepth - (2 * ancestorDepth + 1);
}
export function commonAncestor(first, second) {
    const a = first.split('.');
    if (a.length < 2) {
        return null;
    }
    const b = second.split('.');
    if (b.length < 2) {
        return null;
    }
    let ancestor = [];
    for (let i = 0; i < Math.min(a.length, b.length) - 1 && a[i] === b[i]; i++) {
        ancestor.push(a[i]);
    }
    if (ancestor.length === 0) {
        return null;
    }
    return ancestor.join('.');
}
/**
 * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
 * going up from parent to the root
 * @example
 * ```ts
 * ancestorsFqn('a.b.c.d')
 * // ['a.b.c', 'a.b', 'a']
 * ```
 */
export function ancestorsFqn(fqn) {
    const path = fqn.split('.');
    path.pop();
    if (!hasAtLeast(path, 2)) {
        return path;
    }
    for (let i = 1; i < path.length; i++) {
        path[i] = (path[i - 1] + '.' + path[i]);
    }
    return path.reverse();
}
/**
 * Compares two fully qualified names (fqns) hierarchically based on their depth.
 * From parent nodes to leaves
 *
 * @param {string} a - The first fqn to compare.
 * @param {string} b - The second fqn to compare.
 * @returns {number} - 0 if the fqns have the same depth.
 *                    - Positive number if a is deeper than b.
 *                    - Negative number if b is deeper than a.
 */
export function compareFqnHierarchically(a, b) {
    const depthA = a.split('.').length;
    const depthB = b.split('.').length;
    switch (true) {
        case depthA > depthB: {
            return 1;
        }
        case depthA < depthB: {
            return -1;
        }
        default: {
            return 0;
        }
    }
}
export function compareByFqnHierarchically(a, b) {
    return compareFqnHierarchically(a.id, b.id);
}
/**
 * Sorts an array of objects hierarchically based on their fully qualified names (FQN).
 * Objects are sorted by the number of segments in their FQN (defined by dot-separated ID).
 *
 * @typeParam T - Object type that contains an 'id' string property
 * @typeParam A - Type extending IterableContainer of T
 *
 * @param array - Array of objects to be sorted
 * @returns A new array with items sorted by their FQN hierarchy depth (number of segments)
 *
 * @example
 * ```ts
 * const items = [
 *   { id: "a.b.c" },
 *   { id: "a" },
 *   { id: "a.b" }
 * ];
 * sortByFqnHierarchically(items);
 * // Result: [
 * //   { id: "a" },
 * //   { id: "a.b" },
 * //   { id: "a.b.c" }
 * // ]
 * ```
 */
export function sortByFqnHierarchically(array) {
    return array
        .map(item => ({ item, fqn: item.id.split('.') }))
        .sort((a, b) => {
        return a.fqn.length - b.fqn.length;
    })
        .map(({ item }) => item);
}
function findTopAncestor(items, item) {
    let parent = item;
    for (const e of items) {
        if (e !== parent && isAncestor(e, parent)) {
            parent = e;
        }
    }
    return parent !== item ? parent : null;
}
/**
 * Keeps initial order of the elements, but ensures that parents are before children
 *
 * @example
 * ```ts
 * const items = [
 *   {id: 'a.c'},
 *   {id: 'a'},
 *   {id: 'a.b.c'},
 *   {id: 'a.b'},
 * ];
 * sortParentsFirst(items);
 * // Result: [
 * //   { id: "a" },
 * //   { id: "a.c" }, // because of initial order
 * //   { id: "a.b" },
 * //   { id: "a.b.c" },
 * // ]
 * ```
 */
export function sortParentsFirst(array) {
    const result = [];
    const items = [...array];
    let item;
    while ((item = items.shift())) {
        let parent;
        while ((parent = findTopAncestor(items, item))) {
            result.push(...items.splice(items.indexOf(parent), 1));
        }
        result.push(item);
    }
    return result;
}
export function sortNaturalByFqn(array, sort) {
    if (!array || isString(array)) {
        const dir = array ?? 'asc';
        return (arr) => sortNaturalByFqn(arr, dir);
    }
    const dir = sort === 'desc' ? -1 : 1;
    return array
        .map(item => ({ item, fqn: item.id.split('.') }))
        .sort((a, b) => {
        if (a.fqn.length !== b.fqn.length) {
            return (a.fqn.length - b.fqn.length) * dir;
        }
        for (let i = 0; i < a.fqn.length; i++) {
            const compare = compareNatural(a.fqn[i], b.fqn[i]);
            if (compare !== 0) {
                return compare;
            }
        }
        return 0;
    })
        .map(({ item }) => item);
}
