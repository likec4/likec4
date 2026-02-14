import type { LikeC4Model } from '../../../model';
import type { AnyAux } from '../../../types';
import { type ModelRelationExpr, ModelFqnExpr } from '../../../types';
import type { ConnectionWhere, PredicateExecutor } from '../_types';
export declare const OutgoingExprPredicate: PredicateExecutor<ModelRelationExpr.Outgoing<AnyAux>>;
export declare function outgoingConnectionPredicate(model: LikeC4Model, expr: ModelFqnExpr.NonWildcard): ConnectionWhere;
