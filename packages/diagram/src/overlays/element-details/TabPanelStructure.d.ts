import type { LikeC4Model } from '@likec4/core/model';
import { type ReactNode } from 'react';
interface ElementTreeNodeData {
    label: ReactNode;
    value: string;
    element: LikeC4Model.Element;
    type: 'ancestor' | 'current' | 'descedant';
    children: TreeNodeData[];
}
export interface MessageNodeData {
    label: ReactNode;
    value: string;
    type: 'message';
    children: TreeNodeData[];
}
export type TreeNodeData = ElementTreeNodeData | MessageNodeData;
type TabPanelStructureProps = {
    element: LikeC4Model.Element;
};
export declare const ElementLabel: ({ element, }: {
    element: LikeC4Model.Element;
    type: "ancestor" | "current" | "descedant";
}) => import("react").JSX.Element;
export declare function TabPanelStructure({ element, }: TabPanelStructureProps): import("react").JSX.Element;
export {};
