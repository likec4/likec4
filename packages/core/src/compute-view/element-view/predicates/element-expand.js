import { FqnRef } from '../../../types';
import { findConnectionsWithin, resolveElements } from './_utils';
export const ExpandedElementPredicate = {
    include: ({ expr, model, stage, where }) => {
        const parent = model.element(FqnRef.flatten(expr.ref));
        if (where(parent)) {
            stage.addExplicit(parent);
            stage.connectWithExisting(parent);
        }
        const children = [...parent.children()].filter(where);
        const expanded = [];
        for (const child of children) {
            stage.addImplicit(child);
            if (stage.connectWithExisting(child)) {
                expanded.push(child);
            }
        }
        stage.addConnections(findConnectionsWithin(expanded));
        return stage;
    },
    exclude: ({ expr, model, stage, filterWhere }) => {
        const elements = filterWhere(resolveElements(model, expr));
        stage.exclude(elements);
        return stage;
    },
};
