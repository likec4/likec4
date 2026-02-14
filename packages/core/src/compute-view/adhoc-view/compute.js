import { ViewId } from '../../types';
import { computeElementView } from '../element-view/compute';
/**
 * Computes an adhoc view based on the given predicates.
 * Adhoc views are not defined in the model, but computed on demand.
 * Available for logical model only.
 *
 * @param predicates accepts the same predicates as element view.
 * @param likec4model The LikeC4 model to compute view.
 * @returns The computed adhoc view.
 */
export function computeAdhocView(likec4model, predicates) {
    const parsedElementView = {
        id: ViewId('adhoc'),
        _stage: 'parsed',
        _type: 'element',
        rules: predicates,
        title: null,
        description: null,
    };
    const computedElementView = computeElementView(likec4model, parsedElementView);
    return {
        ...computedElementView,
        _type: 'adhoc',
        _stage: 'computed',
    };
}
