import { commonAncestor, compareFqnHierarchically } from './fqn';
/**
 * Compares two relations hierarchically.
 * From the most general (implicit) to the most specific (deepest in the tree)
 */
export const compareRelations = (a, b) => {
    const parentA = commonAncestor(a.source.id, a.target.id);
    const parentB = commonAncestor(b.source.id, b.target.id);
    if (parentA && !parentB) {
        return 1;
    }
    if (!parentA && parentB) {
        return -1;
    }
    const compareParents = parentA && parentB ? compareFqnHierarchically(parentA, parentB) : 0;
    if (compareParents !== 0) {
        return compareParents;
    }
    const compareSource = compareFqnHierarchically(a.source.id, b.source.id);
    if (compareSource !== 0) {
        return compareSource;
    }
    return compareFqnHierarchically(a.target.id, b.target.id);
};
