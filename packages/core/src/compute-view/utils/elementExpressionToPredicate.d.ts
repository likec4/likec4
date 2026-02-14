import { type Predicate, ModelFqnExpr } from '../../types';
export declare function elementExprToPredicate<T extends {
    id: string;
    tags: readonly string[];
    kind: string;
}>(target: ModelFqnExpr.Any): Predicate<T>;
