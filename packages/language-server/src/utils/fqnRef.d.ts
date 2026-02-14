import { ast } from '../ast';
export declare function referenceableParent(node: ast.FqnRef): ast.Referenceable | null;
export declare function instanceRef(deploymentRef: ast.FqnRef): ast.DeployedInstance | null;
export declare function deploymentNodeRef(deploymentRef: ast.FqnRef): ast.DeploymentNode | null;
export declare function importsRef(node: ast.FqnRef): ast.Imported | null;
export declare function isImportsRef(node: ast.FqnRef): boolean;
export declare function isReferenceToLogicalModel(node: ast.FqnRef): boolean;
/**
 * Returns true if node references deployment model
 */
export declare function isReferenceToDeploymentModel(node: ast.FqnRef): boolean;
