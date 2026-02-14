import { type ValidationCheck } from 'langium';
import { ast } from '../ast';
import type { LikeC4Services } from '../module';
export declare const opacityPropertyRuleChecks: (_: LikeC4Services) => ValidationCheck<ast.OpacityProperty>;
export declare const iconPropertyRuleChecks: (_: LikeC4Services) => ValidationCheck<ast.IconProperty>;
export declare const colorLiteralRuleChecks: (_: LikeC4Services) => ValidationCheck<ast.ColorLiteral>;
