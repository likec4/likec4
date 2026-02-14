import type { DiagramEdge } from '@likec4/core/types';
import type { HTMLAttributes } from 'react';
import type { UndefinedOnPartialDeep } from 'type-fest';
import type { BaseEdgePropsWithData } from '../../base/types';
type Data = UndefinedOnPartialDeep<Pick<DiagramEdge, 'labelBBox' | 'color'>>;
type EdgeLabelContainerProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * label position with optional translate
     */
    labelPosition?: {
        x?: number | undefined;
        y?: number | undefined;
        translate?: string | undefined;
    } | undefined;
    edgeProps: BaseEdgePropsWithData<Data>;
};
export declare function EdgeLabelContainer({ edgeProps: { id, selected, data: { hovered: isHovered, active: isActive, dimmed: isDimmed, labelBBox, color, }, animated, }, labelPosition: labelXY, className, style: _, // omit styles for container
children, ...rest }: EdgeLabelContainerProps): import("react").JSX.Element;
export {};
