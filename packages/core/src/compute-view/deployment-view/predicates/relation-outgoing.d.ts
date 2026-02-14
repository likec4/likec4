import type { LikeC4DeploymentModel, RelationshipModel } from '../../../model';
import type { AnyAux, RelationExpr } from '../../../types';
import { FqnExpr } from '../../../types';
import type { Connection, Elem, PredicateExecutor } from '../_types';
export declare const OutgoingRelationPredicate: PredicateExecutor<RelationExpr.Outgoing>;
export declare function filterOutgoingConnections(sources: Elem[]): (connection: Connection) => boolean;
export declare function resolveAllOutgoingRelations<A extends AnyAux>(model: LikeC4DeploymentModel<A>, moodelRef: FqnExpr.ModelRef<A>): Set<RelationshipModel<A>>;
