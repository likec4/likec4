import type { LikeC4Model } from '@likec4/core/model';
type RelationshipsTabPanelProps = {
    node: LikeC4Model.Node | null;
    element: LikeC4Model.Element;
};
export declare function TabPanelRelationships({ node, element, }: RelationshipsTabPanelProps): import("react").JSX.Element;
export {};
