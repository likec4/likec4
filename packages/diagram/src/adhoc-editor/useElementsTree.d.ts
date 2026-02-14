import type { LikeC4Model } from '@likec4/core/model';
import type { ElementShape, Fqn } from '@likec4/core/types';
import type { TreeCollection } from '@zag-js/collection';
import * as tree from '@zag-js/tree-view';
import type { ElementStates } from './state/utils';
export interface TreeNodeData {
    id: Fqn;
    title: string;
    icon?: string | undefined;
    shape: ElementShape;
    children: TreeNodeData[];
    state: 'include-explicit' | 'include-implicit' | 'exclude' | 'disabled' | 'not-present';
}
export interface ElementsTreeProps extends tree.Props<TreeNodeData> {
}
export declare function createTreeCollection(model: LikeC4Model, states?: ElementStates): TreeCollection<TreeNodeData>;
export type TreeApi = tree.Api<any, TreeNodeData>;
export declare function useElementsTree(): TreeApi;
