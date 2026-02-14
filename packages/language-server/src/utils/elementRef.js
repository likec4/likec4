import { ast } from '../ast';
/**
 * Returns referenced AST Element
 */
export function elementRef(node) {
    try {
        let el = ast.isStrictFqnElementRef(node) ? node.el.ref : node.modelElement.value.ref;
        if (el?.$type === 'Imported') {
            el = el.imported.ref;
        }
        return el?.$type === 'Element' ? el : undefined;
    }
    catch {
        // ignore reference errors
        return undefined;
    }
}
/**
 * Returns FQN of StrictFqnElementRef
 * a.b.c.d - for c node returns a.b.c
 */
export function readStrictFqn(node) {
    const name = [node.$type === 'StrictFqnRef' ? node.value.$refText : node.el.$refText];
    let parent = node.parent;
    while (parent) {
        name.push(parent.$type === 'StrictFqnRef' ? parent.value.$refText : parent.el.$refText);
        parent = parent.parent;
    }
    if (name.length === 1) {
        return name[0];
    }
    return name.reverse().join('.');
}
