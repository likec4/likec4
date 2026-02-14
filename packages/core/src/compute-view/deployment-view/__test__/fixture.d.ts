import type { DeploymentRulesBuilderOp } from '../../../builder';
declare const $include: any, $exclude: any;
export declare const builder: any;
export type Types = typeof builder['Types'];
export { $exclude, $include };
export declare function computeView(...rules: DeploymentRulesBuilderOp<Types>[]): any;
export declare function computeNodesAndEdges(...rules: DeploymentRulesBuilderOp<Types>[]): {
    Nodes: any;
    edges: any;
};
export declare function createModel(): any;
