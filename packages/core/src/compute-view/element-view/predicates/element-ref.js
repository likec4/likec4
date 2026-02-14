import { findConnectionsWithin, resolveElements } from './_utils';
export const ElementRefPredicate = {
    include: ({ expr, model, stage, filterWhere }) => {
        const elements = filterWhere(resolveElements(model, expr));
        if (elements.length === 0) {
            return;
        }
        stage.addExplicit(elements);
        stage.connectWithExisting(elements);
        stage.addConnections(findConnectionsWithin(elements));
        return stage;
    },
    exclude: ({ expr, model, stage, filterWhere }) => {
        const elements = filterWhere(resolveElements(model, expr));
        stage.exclude(elements);
        return stage;
    },
};
