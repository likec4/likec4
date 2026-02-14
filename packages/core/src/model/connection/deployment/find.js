import { isSameHierarchy } from '../../../utils';
import { DeploymentConnectionModel } from './DeploymentConnectionModel';
export function findConnection(source, target, direction = 'directed') {
    if (source === target) {
        return [];
    }
    if (isSameHierarchy(source, target)) {
        return [];
    }
    const directedIntersection = source.allOutgoing.intersect(target.allIncoming);
    const directed = directedIntersection.nonEmpty
        ? [
            new DeploymentConnectionModel(source, target, directedIntersection),
        ]
        : [];
    if (direction === 'directed') {
        return directed;
    }
    return [
        ...directed,
        ...findConnection(target, source, 'directed'),
    ];
}
/**
 * Resolve all connections between element and others
 * By default, look for both directions.
 *
 * @default direction both
 */
export function findConnectionsBetween(element, others, direction = 'both') {
    if (element.allIncoming.isEmpty && element.allOutgoing.isEmpty) {
        return [];
    }
    // We separate resolved connection,
    // because we want return outgoing first
    const outgoing = [];
    const incoming = [];
    for (const _other of others) {
        if (element === _other) {
            continue;
        }
        for (const found of findConnection(element, _other, direction)) {
            if (found.source === element) {
                outgoing.push(found);
            }
            else {
                incoming.push(found);
            }
        }
    }
    return [
        ...outgoing,
        ...incoming,
    ];
}
/**
 * Resolve all connections within a given set of elements
 */
export function findConnectionsWithin(elements) {
    return [...elements].reduce((acc, el, index, array) => {
        // skip for last element
        if (index === array.length - 1) {
            return acc;
        }
        acc.push(...findConnectionsBetween(el, array.slice(index + 1), 'both'));
        return acc;
    }, []);
}
