import type { DeploymentElementModel, RelationshipModel } from '../../../model';
import { type DeploymentConnectionModel } from '../../../model';
import type { AnyAux } from '../../../types';
import { type OperatorPredicate } from '../../../types';
import type { ExcludePredicateCtx, PredicateCtx } from '../_types';
import type { StageExclude, StageInclude } from '../memory';
/**
 * Builds a patch object from an expression
 */
export declare function predicateToPatch(op: 'include' | 'exclude', { expr, where, ...ctx }: PredicateCtx): StageExclude | StageInclude | undefined;
export declare function excludeModelRelations<M extends AnyAux>(relationsToExclude: ReadonlySet<RelationshipModel<M>>, { stage, memory }: Pick<ExcludePredicateCtx, 'stage' | 'memory'>, where: OperatorPredicate<M> | null, filterConnections?: (c: DeploymentConnectionModel<M>) => boolean): StageExclude;
export declare function matchConnection<M extends AnyAux>(c: DeploymentConnectionModel<M>, where: OperatorPredicate<M> | null): boolean;
/**
 * Filters relations of the provided connections using the provided predicate.
 * And copy of the connection with the filtered relations will be created.
 * Connections left without relations are removed from resulting collection.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A copy of the connection with the filtered relations
 */
export declare function applyPredicate<M extends AnyAux>(c: readonly DeploymentConnectionModel<M>[], where: OperatorPredicate<M> | null): readonly DeploymentConnectionModel<M>[];
/**
 * Filters relations of the connection using the provided predicate.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A deep copy of the original collection with the filtered relations
 */
export declare function applyPredicate<M extends AnyAux>(c: DeploymentConnectionModel<M>, where: OperatorPredicate<M> | null): DeploymentConnectionModel<M>;
/**
 * Creates a function that filters relations of the provided connections using the provided predicate.
 * Connections left without relations are removed from resulting collection.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A function to create a filtered copy of connections
 */
export declare function applyPredicate<M extends AnyAux>(where: OperatorPredicate<M> | null): (data: readonly DeploymentConnectionModel<M>[]) => readonly DeploymentConnectionModel<M>[];
/**
 * Checks elements using the provided predicate.
 *
 * @param c The collection of element to apply the predicate to
 * @param where The predicate
 * @returns Returns array of elements those match the predicate
 */
export declare function applyElementPredicate<M extends AnyAux>(c: readonly DeploymentElementModel<M>[], where: OperatorPredicate<M> | null): readonly DeploymentElementModel<M>[];
/**
 * Checks element using the provided predicate.
 *
 * @param c The element to apply the predicate to
 * @param where The predicate
 * @returns The result of the check
 */
export declare function applyElementPredicate<M extends AnyAux, E extends DeploymentElementModel<M>>(c: E, where: OperatorPredicate<M> | null): boolean;
/**
 * Creates a function that filters elemetns using the provided predicate.
 *
 * @param where The predicate
 * @returns A function to filter elements
 */
export declare function applyElementPredicate<M extends AnyAux, E extends DeploymentElementModel<M>>(where: OperatorPredicate<M> | null): (data: readonly E[]) => readonly E[];
export declare function matchConnections<M extends AnyAux>(connections: readonly DeploymentConnectionModel<M>[], where: OperatorPredicate<M> | null): readonly DeploymentConnectionModel<M>[];
export declare function resolveAscendingSiblings(element: DeploymentElementModel): Set<DeploymentElementModel>;
