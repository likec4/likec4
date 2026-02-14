import type { Fqn } from '@likec4/core/types';
import type { Context } from './actor.types';
/**
 * Derives the state of elements in the view based on the active rules.
 *
 * Categorizes elements into:
 * - Explicitly included: Elements that are both in the view and have an enabled include rule
 * - Implicitly included: Elements in the view without an explicit include rule
 * - Excluded: Elements with an enabled exclude rule that are not in the view
 */
export declare function deriveElementStates({ rules, view }: Pick<Context, 'rules' | 'view'>): {
    includedExplicit: Set<Fqn>;
    includedImplicit: Set<Fqn>;
    excluded: Set<Fqn>;
    disabled: Set<Fqn>;
};
export type ElementStates = ReturnType<typeof deriveElementStates>;
