import { map, pipe } from 'remeda';
import { isString } from '../../utils';
import { isAncestor, isDescendantOf, sortNaturalByFqn, } from '../../utils/fqn';
export function isNestedConnection(nested, parent) {
    if (!parent) {
        const p = nested;
        return (n) => isNestedConnection(n, p);
    }
    const isSameSource = nested.source === parent.source;
    const isSameTarget = nested.target === parent.target;
    if (isSameSource && isSameTarget) {
        return false;
    }
    const isSourceNested = isAncestor(parent.source.id, nested.source.id);
    const isTargetNested = isAncestor(parent.target.id, nested.target.id);
    return ((isSourceNested && isTargetNested)
        || (isSameSource && isTargetNested)
        || (isSameTarget && isSourceNested));
}
export function findDeepestNestedConnection(connections, connection) {
    let deepest = connection;
    for (const c of connections) {
        if (isNestedConnection(c, deepest)) {
            deepest = c;
        }
    }
    return deepest !== connection ? deepest : null;
}
export function sortDeepestFirst(connections) {
    const sorted = [];
    const unsorted = connections.slice();
    let next;
    while ((next = unsorted.shift())) {
        let deepest;
        while ((deepest = findDeepestNestedConnection(unsorted, next))) {
            const index = unsorted.indexOf(deepest);
            sorted.push(unsorted.splice(index, 1)[0]);
        }
        sorted.push(next);
    }
    return sorted;
}
/**
 * To make {@link sortConnectionsByBoundaryHierarchy} work correctly we add '.' to boundary
 * Othwerwise connection without boundary will be considered same level as connection with top-level boundary
 */
export function boundaryHierarchy(conn) {
    return conn.boundary?.id ? `.${conn.boundary.id}` : '';
}
export function sortConnectionsByBoundaryHierarchy(connections, sort) {
    if (!connections || isString(connections)) {
        const dir = connections ?? 'asc';
        return (arr) => _sortByBoundary(arr, dir);
    }
    return _sortByBoundary(connections, sort ?? 'asc');
}
function _sortByBoundary(connections, order) {
    return pipe(connections, map(conn => ({
        id: boundaryHierarchy(conn),
        conn: conn,
    })), sortNaturalByFqn(order), map(p => p.conn));
}
/**
 * Find connections that includes given connection (i.e between it's ancestors)
 */
export function findAscendingConnections(connections, connection) {
    return connections.filter(c => isNestedConnection(connection, c));
}
/**
 * Find connections that given connection includes (i.e between it's descendants)
 */
export function findDescendantConnections(connections, connection) {
    return connections.filter(isNestedConnection(connection));
}
export function mergeConnections(connections) {
    const map = new Map();
    for (const conn of connections) {
        const existing = map.get(conn.id);
        if (existing) {
            map.set(conn.id, conn.mergeWith(existing));
        }
        else {
            map.set(conn.id, conn);
        }
    }
    return [...map.values()];
}
/**
 * Excludes the values existing in `other` array.
 * The output maintains the same order as the input.
 */
export function differenceConnections(source, exclude) {
    const minus = new Map([...exclude].map(c => [c.id, c]));
    return [...source].reduce((acc, c) => {
        const other = minus.get(c.id);
        if (!other) {
            acc.push(c);
            return acc;
        }
        const updated = c.difference(other);
        if (updated.nonEmpty()) {
            acc.push(updated);
        }
        return acc;
    }, []);
}
export function hasSameSourceTarget(a, b) {
    if (b) {
        return a.source === b.source && a.target === b.target;
    }
    return (b) => a.source === b.source && a.target === b.target;
}
export function hasSameSource(a, b) {
    if (b) {
        return a.source === b.source;
    }
    return (b) => a.source === b.source;
}
export function hasSameTarget(a, b) {
    if (b) {
        return a.target === b.target;
    }
    return (b) => a.target === b.target;
}
export function isOutgoing(a, source) {
    if (!source) {
        const _source = a;
        return (b) => isOutgoing(b, _source);
    }
    const at = a;
    return isDescendantOf(at.source, source) && !isDescendantOf(at.target, source);
}
export function isIncoming(a, target) {
    if (!target) {
        const _target = a;
        return (b) => isIncoming(b, _target);
    }
    const at = a;
    return isDescendantOf(at.target, target) && !isDescendantOf(at.source, target);
}
export function isAnyInOut(a, source) {
    if (!source) {
        const _source = a;
        return (b) => isAnyInOut(b, _source);
    }
    const at = a;
    return isDescendantOf(at.source, source) !== isDescendantOf(at.target, source);
}
export function isInside(a, source) {
    if (!source) {
        const _source = a;
        return (b) => isInside(b, _source);
    }
    const at = a;
    return isDescendantOf(at.source, source) && isDescendantOf(at.target, source);
}
// export function isIncoming<T>(target: NoInfer<T>): (a: WithSourceTarget<T>) => boolean
// export function isIncoming<T>(a: WithSourceTarget<T>, target: T): boolean
// export function isIncoming<T = unknown>(a: WithSourceTarget<T> | T, target?: T) {
//   if (target) {
//     return (a as WithSourceTarget<T>).target === target
//   }
//   const _target = a as T
//   return (b: WithSourceTarget) => b.target === _target
// }
// export function isAnyInOut<T>(source: NoInfer<T>): (a: WithSourceTarget<T>) => boolean
// export function isAnyInOut<T>(a: WithSourceTarget<T>, source: T): boolean
// export function isAnyInOut<T = unknown>(a: WithSourceTarget<T> | T, source?: T) {
//   if (source) {
//     return hasSameSource(a as WithSourceTarget<T>, source) || hasSameTarget(a as WithSourceTarget<T>, source)
//   }
//   const _source = a as T
//   return (b: WithSourceTarget) => hasSameSource(b, _source) || hasSameTarget(b, _source)
// }
