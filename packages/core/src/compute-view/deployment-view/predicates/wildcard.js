import { map, pipe } from 'remeda';
import { findConnectionsWithin } from '../utils';
import { applyElementPredicate } from './utils';
export const WildcardPredicate = {
    include: ({ model, stage, where }) => {
        const children = [];
        const rootElements = pipe([...model.roots()], applyElementPredicate(where), map(root => {
            if (!root.onlyOneInstance()) {
                children.push(...root.children());
            }
            return root;
        }));
        stage.addExplicit(rootElements);
        if (children.length > 1) {
            stage.addConnections(findConnectionsWithin([
                ...rootElements,
                ...children,
            ]));
        }
        return stage;
    },
    exclude: ({ stage, memory, where }) => {
        const elementsToExclude = pipe([...memory.elements], applyElementPredicate(where));
        stage.exclude(elementsToExclude);
        return stage;
    },
};
