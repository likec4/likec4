import type { LikeC4DeploymentModel, RelationshipModel } from '../../../model';
import type { AnyAux, RelationExpr } from '../../../types';
import { FqnExpr } from '../../../types';
import type { Connection, Elem, PredicateExecutor } from '../_types';
export declare const IncomingRelationPredicate: PredicateExecutor<RelationExpr.Incoming>;
export declare function filterIncomingConnections(targets: Elem[]): (connection: Connection) => boolean;
export declare function resolveAllImcomingRelations<A extends AnyAux>(model: LikeC4DeploymentModel<A>, moodelRef: FqnExpr.ModelRef<A>): Set<RelationshipModel<A>>;
