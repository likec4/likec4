import { unique, values } from 'remeda';
import { isElementView, isExtendsElementView } from '../../types/view';
import Graph from 'graphology';
import { topologicalSort } from 'graphology-dag/topological-sort';
import willCreateCycle from 'graphology-dag/will-create-cycle';
import { isNonEmptyArray } from '../../utils';
/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
export function resolveRulesExtendedViews(unresolvedViews) {
    const g = new Graph({
        type: 'directed',
    });
    const extendedViews = [];
    for (const view of values(unresolvedViews)) {
        g.addNode(view.id, { view });
        if (isExtendsElementView(view)) {
            extendedViews.push(view);
        }
    }
    if (extendedViews.length === 0) {
        return unresolvedViews;
    }
    for (const view of extendedViews) {
        if (!g.hasNode(view.extends)) {
            console.warn(`View "${view.id}" extends from "${view.extends}" which does not exist`);
            continue;
        }
        if (willCreateCycle(g, view.id, view.extends)) {
            console.warn(`View "${view.id}" extends from "${view.extends}" which creates a cycle`);
            continue;
        }
        // view -> parent
        g.addDirectedEdge(view.id, view.extends);
    }
    const sorted = topologicalSort(g).reverse();
    return sorted.reduce((acc, id) => {
        const view = g.getNodeAttribute(id, 'view');
        if (!isExtendsElementView(view)) {
            acc[view.id] = view;
            return acc;
        }
        const extendsFrom = acc[view.extends];
        if (!extendsFrom || !isElementView(extendsFrom)) {
            return acc;
        }
        const tags = unique([
            ...(extendsFrom.tags ?? []),
            ...(view.tags ?? []),
        ]);
        const links = [
            ...(extendsFrom.links ?? []),
            ...(view.links ?? []),
        ];
        acc[view.id] = {
            ...extendsFrom,
            ...view,
            title: view.title ?? extendsFrom.title ?? null,
            description: view.description ?? extendsFrom.description ?? null,
            tags,
            links: isNonEmptyArray(links) ? links : null,
            rules: [...extendsFrom.rules, ...view.rules],
        };
        return acc;
    }, {});
    // forEachNodeInTopologicalOrder(g, (_id, { view }) => {
    // })
    // return ordered as V
}
