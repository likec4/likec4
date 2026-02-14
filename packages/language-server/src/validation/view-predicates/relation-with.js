import { getViewRulePredicateContainer } from '../../ast';
import { tryOrLog } from '../_shared';
export const checkRelationExprWith = (_services) => {
    return tryOrLog((el, accept) => {
        const container = getViewRulePredicateContainer(el);
        if (!container || container.$type == 'DynamicViewIncludePredicate') {
            return;
        }
        if (!container.isInclude) {
            accept('error', 'Invalid usage inside "exclude"', {
                node: el,
            });
            return;
        }
    });
};
