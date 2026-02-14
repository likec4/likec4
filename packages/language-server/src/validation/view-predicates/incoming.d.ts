import { type ValidationCheck } from 'langium';
import { ast } from '../../ast';
import type { LikeC4Services } from '../../module';
export declare const checkIncomingRelationExpr: (_services: LikeC4Services) => ValidationCheck<ast.IncomingRelationExpr>;
