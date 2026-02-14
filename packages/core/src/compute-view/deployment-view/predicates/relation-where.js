import { whereOperatorAsPredicate } from '../../../types';
import { predicateToPatch } from './utils';
// relation matches the condition
export const WhereRelationPredicate = {
    include: ({ expr, model, memory, stage }) => {
        const where = whereOperatorAsPredicate(expr.where.condition);
        return predicateToPatch('include', { expr: expr.where.expr, model, stage, memory, where });
    },
    exclude: ({ expr, model, memory, stage }) => {
        const where = whereOperatorAsPredicate(expr.where.condition);
        return predicateToPatch('exclude', { expr: expr.where.expr, model, stage, memory, where });
    }
};
