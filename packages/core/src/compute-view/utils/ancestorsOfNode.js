import { nonNullable } from '../../utils';
/**
 * Returns the ancestors of given computed node, starting with the direct parent and ending with the root node.
 */
export function ancestorsOfNode(node, nodes) {
    const ancestors = [];
    let parentId = node.parent;
    while (parentId) {
        const parentNode = nonNullable(nodes.get(parentId), `Parent node ${parentId} not found`);
        ancestors.push(parentNode);
        parentId = parentNode.parent;
    }
    return ancestors;
}
