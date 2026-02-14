import type { Color, ElementStyle } from '@likec4/core/types';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import type { BaseNode, BaseNodeProps } from '../../base/types';
export type RequiredData = {
    color: Color;
    depth: number;
    style: ElementStyle;
};
type CompoundNodeContainerProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
    layout?: boolean | 'position' | 'size' | 'preserve-aspect';
    layoutId?: string | undefined;
    nodeProps: BaseNodeProps<BaseNode<RequiredData>>;
}>;
export declare function CompoundNodeContainer({ nodeProps: { data: { hovered: isHovered, dimmed: isDimmed, ...data }, }, className, children, style, ...rest }: CompoundNodeContainerProps): import("react").JSX.Element;
export {};
