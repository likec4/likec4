import { type LikeC4Model } from '../../../model';
import type { ModelRelationExpr } from '../../../types';
import { type AnyAux, ModelFqnExpr } from '../../../types';
import type { ConnectionWhere, PredicateExecutor } from '../_types';
export declare const IncomingExprPredicate: PredicateExecutor<ModelRelationExpr.Incoming<AnyAux>>;
export declare function incomingConnectionPredicate(model: LikeC4Model, expr: ModelFqnExpr.NonWildcard): ConnectionWhere;
