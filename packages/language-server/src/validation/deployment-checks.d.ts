import { type ValidationCheck } from 'langium';
import { ast } from '../ast';
import type { LikeC4Services } from '../module';
export declare const deploymentNodeChecks: (services: LikeC4Services) => ValidationCheck<ast.DeploymentNode>;
export declare const deployedInstanceChecks: (services: LikeC4Services) => ValidationCheck<ast.DeployedInstance>;
export declare const deploymentRelationChecks: (services: LikeC4Services) => ValidationCheck<ast.DeploymentRelation>;
export declare const extendDeploymentChecks: (_services: LikeC4Services) => ValidationCheck<ast.ExtendDeployment>;
