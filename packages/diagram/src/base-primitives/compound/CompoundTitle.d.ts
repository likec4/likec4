import type { Color, ComputedNodeStyle, NodeId } from '@likec4/core/types';
type RequiredData = {
    id: NodeId;
    title: string;
    color: Color;
    style: ComputedNodeStyle;
    icon?: string | null;
};
type CompoundTitleProps = {
    data: RequiredData;
};
export declare function CompoundTitle({ data }: CompoundTitleProps): import("react").JSX.Element;
export {};
