import { unique } from 'remeda';
import { ModelFqnExpr } from '../../../types';
import { toArray, toSet } from '../../../utils/iterable/to';
import { findConnectionsBetween, resolveAndIncludeFromMemory, resolveElements } from './_utils';
export const InOutRelationPredicate = {
    include: ({ expr: { inout }, scope, model, memory, stage, filterWhere }) => {
        const connections = [];
        if (ModelFqnExpr.isWildcard(inout)) {
            if (!scope) {
                return;
            }
            connections.push(...findConnectionsBetween(scope, scope.ascendingSiblings()));
        }
        else {
            const elements = resolveAndIncludeFromMemory(inout, { memory, model });
            let visibleElements = [...memory.elements];
            if (visibleElements.length === 0) {
                visibleElements = unique(elements.flatMap(el => toArray(el.ascendingSiblings())));
            }
            for (const el of elements) {
                connections.push(...findConnectionsBetween(el, visibleElements));
            }
        }
        stage.addConnections(filterWhere(connections));
        return stage;
    },
    exclude: ({ expr: { inout }, model, scope, stage, where }) => {
        const excluded = [];
        if (ModelFqnExpr.isWildcard(inout)) {
            if (!scope) {
                return;
            }
            excluded.push(...scope.allOutgoing);
            excluded.push(...scope.allIncoming);
        }
        else {
            const elements = resolveElements(model, inout);
            excluded.push(...elements.flatMap(e => [...e.allOutgoing, ...e.allIncoming]));
        }
        stage.excludeRelations(toSet(excluded.filter(where)));
        return stage;
    },
};
