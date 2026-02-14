import type { DeploymentConnectionModel, DeploymentElementModel, ElementModel, LikeC4DeploymentModel, LikeC4Model } from '../../model';
import type { AnyAux, aux, ComputedEdge, ComputedNode, DeploymentViewRule, Unknown } from '../../types';
import { FqnExpr } from '../../types';
import type { Memory } from './_types';
export declare const findConnection: any, findConnectionsBetween: any, findConnectionsWithin: any;
type Predicate<T> = (x: T) => boolean;
export declare function resolveElements<A extends AnyAux>(model: LikeC4DeploymentModel<A>, expr: FqnExpr.DeploymentRef<A>): DeploymentElementModel<A>[];
export declare function resolveModelElements<A extends AnyAux>(model: LikeC4DeploymentModel<A>, expr: FqnExpr.ModelRef<A>): ElementModel<A>[];
export declare function deploymentExpressionToPredicate<A extends AnyAux, N extends {
    id: string | aux.DeploymentFqn<A>;
    modelRef?: aux.Fqn<A> | undefined;
}>(target: FqnExpr<A>): Predicate<N>;
export declare function toComputedEdges<A extends AnyAux>(connections: ReadonlyArray<DeploymentConnectionModel<A>>): ComputedEdge<A>[];
export declare function buildNodes<A extends AnyAux = Unknown>(model: LikeC4Model<A>, memory: Memory): ReadonlyMap<aux.NodeId, ComputedNode<A>>;
export declare function applyDeploymentViewRuleStyles<A extends AnyAux>(rules: DeploymentViewRule<A>[], nodes: ComputedNode<A>[]): ComputedNode<A>[];
export {};
