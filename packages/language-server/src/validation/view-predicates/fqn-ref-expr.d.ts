import type { ValidationCheck } from 'langium';
import { ast } from '../../ast';
import type { LikeC4Services } from '../../module';
export declare const checkFqnRefExpr: (services: LikeC4Services) => ValidationCheck<ast.FqnRefExpr>;
