import type { ComputedNodeStyle, ElementShape } from '@likec4/core/types';
type RequiredData = {
    shape: ElementShape;
    width: number;
    height: number;
    style?: ComputedNodeStyle;
};
type ElementShapeProps = {
    data: RequiredData;
    width?: number | undefined;
    height?: number | undefined;
    /**
     * @default true
     */
    showSeletionOutline?: boolean | undefined;
};
export declare function ElementShape({ data, width, height, showSeletionOutline }: ElementShapeProps): import("react").JSX.Element;
export {};
