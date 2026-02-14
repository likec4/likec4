import { $expr } from '../../builder/Builder.view-element';
import { computeAdhocView } from './compute';
/**
 * Allows you to define type-safe adhoc views using types from the model.
 */
export class AdhocView {
    model;
    /**
     * Creates a new adhoc view builder.
     */
    static use(model) {
        return new AdhocView(model);
    }
    #predicates = [];
    constructor(model) {
        this.model = model;
    }
    /**
     * Used to cache the type of the predicates.
     */
    Expr;
    include(...predicates) {
        this.#predicates.push({
            // @ts-ignore types mismatch, ok for internal use
            include: predicates.map(predicate => $expr(predicate)),
        });
        return this;
    }
    exclude(...predicates) {
        this.#predicates.push({
            // @ts-ignore types mismatch, ok for internal use
            exclude: predicates.map(predicate => $expr(predicate)),
        });
        return this;
    }
    compute() {
        return computeAdhocView(this.model, this.#predicates);
    }
}
