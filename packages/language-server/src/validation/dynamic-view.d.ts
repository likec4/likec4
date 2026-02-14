import { type ValidationCheck } from 'langium';
import { ast } from '../ast';
import type { LikeC4Services } from '../module';
export declare const dynamicViewStepSingle: (services: LikeC4Services) => ValidationCheck<ast.DynamicStepSingle>;
export declare const dynamicViewStepChain: (services: LikeC4Services) => ValidationCheck<ast.DynamicStepChain>;
export declare const dynamicViewDisplayVariant: (_services: LikeC4Services) => ValidationCheck<ast.DynamicViewDisplayVariantProperty>;
