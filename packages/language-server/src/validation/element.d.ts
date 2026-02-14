import { type ValidationCheck } from 'langium';
import type { ast } from '../ast';
import type { LikeC4Services } from '../module';
export declare const checkElement: (services: LikeC4Services) => ValidationCheck<ast.Element>;
