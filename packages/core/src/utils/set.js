import { intersection as _intersection, symmetricDifference as _symmetricDifference, } from 'mnemonist/patch';
import { hasAtLeast } from 'remeda';
/**
 * Returns new set as a union of given sets
 * Keeps order of elements
 */
export function union(...sets) {
    let result = new Set();
    for (const set of sets) {
        for (const value of set) {
            result.add(value);
        }
    }
    return result;
}
/**
 * Returns new set as an intersection of all sets
 * Keeps order from the first set
 */
export function intersection(first, ...sets) {
    let result = new Set();
    // If first set is empty, return empty set
    if (first.size === 0) {
        return result;
    }
    let other = hasAtLeast(sets, 2) ? _intersection(...sets) : sets[0];
    if (other.size === 0) {
        return result;
    }
    for (const value of first) {
        if (other.has(value)) {
            result.add(value);
        }
    }
    return result;
}
/**
 * Returns new set as a difference of two sets (A-B)
 * Keeps order from the first set
 */
export function difference(a, b) {
    if (a.size === 0) {
        return new Set();
    }
    if (b.size === 0) {
        return new Set(a);
    }
    let result = new Set();
    for (const value of a) {
        if (!b.has(value)) {
            result.add(value);
        }
    }
    return result;
}
export function equals(a, b) {
    return a.size === b.size && [...a].every(value => b.has(value));
}
export function symmetricDifference(a, b) {
    return _symmetricDifference(a, b);
}
export function hasIntersection(a, b) {
    if (a.size === 0 || b.size === 0) {
        return false;
    }
    // Swap sets to iterate over smaller set
    if (b.size < a.size) {
        ;
        [a, b] = [b, a];
    }
    for (const value of a) {
        if (b.has(value)) {
            return true;
        }
    }
    return false;
}
