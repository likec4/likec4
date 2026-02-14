import type { Fqn, ViewId } from '@likec4/core/types';
interface LikeC4ModelTreeNodeData {
    label: string;
    value: Fqn;
    children: LikeC4ModelTreeNodeData[];
}
export declare const sortByLabel: (a: LikeC4ModelTreeNodeData, b: LikeC4ModelTreeNodeData) => number;
/**
 * Returns a tree of elements in the model.
 * If `viewId` is provided, returns the tree of elements in the view.
 */
export declare function useLikeC4ElementsTree(viewId?: ViewId): LikeC4ModelTreeNodeData[];
export {};
