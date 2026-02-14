import { type ValidationCheck } from 'langium';
import { ast } from '../ast';
import type { LikeC4Services } from '../module';
export declare const relationChecks: (services: LikeC4Services) => ValidationCheck<ast.Relation>;
export declare const checkRelationBody: (_services: LikeC4Services) => ValidationCheck<ast.RelationBody>;
export declare const extendRelationChecks: (services: LikeC4Services) => ValidationCheck<ast.ExtendRelation>;
