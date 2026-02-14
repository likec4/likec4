import { isElementView } from '@likec4/core';
import { find, isNullish } from 'remeda';
export function assignNavigateTo(views) {
    const allElementViews = new Map();
    for (const v of views) {
        if (isElementView(v) && v.viewOf && isNullish(v.extends)) {
            const viewsOf = allElementViews.get(v.viewOf) ?? [];
            viewsOf.push(v.id);
            allElementViews.set(v.viewOf, viewsOf);
        }
    }
    // set default navigateTo
    for (const { id, nodes } of views) {
        for (const node of nodes) {
            const modelRef = node.modelRef;
            if (node.navigateTo || !modelRef) {
                continue;
            }
            // find first element view that is not the current one
            const navigateTo = find(allElementViews.get(modelRef) ?? [], v => v !== id);
            if (navigateTo) {
                node.navigateTo = navigateTo;
            }
        }
    }
    return views;
}
