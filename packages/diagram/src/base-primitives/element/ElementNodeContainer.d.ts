import { type Color, type ComputedNodeStyle, type ElementShape } from '@likec4/core/types';
import type { MotionNodeLayoutOptions, MotionStyle } from 'motion/react';
import type { BaseNodePropsWithData } from '../../base/types';
type RequiredData = {
    color: Color;
    shape: ElementShape;
    style?: ComputedNodeStyle;
};
/**
 * Top-level primitive to compose leaf nodes renderers.
 * This container provides the state via data-* attributes
 */
export declare const ElementNodeContainer: import("react").ForwardRefExoticComponent<{
    [key: `data-${string}`]: string;
    nodeProps: BaseNodePropsWithData<RequiredData>;
    className?: string | undefined;
    style?: MotionStyle | undefined;
} & MotionNodeLayoutOptions & {
    children?: import("react").ReactNode | undefined;
} & import("react").RefAttributes<HTMLDivElement>>;
export {};
