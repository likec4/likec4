import type { DiagramEdge } from '@likec4/core/types';
import { type PointerEventHandler } from 'react';
import type { UndefinedOnPartialDeep } from 'type-fest';
import type { BaseEdgePropsWithData } from '../../base/types';
type Data = UndefinedOnPartialDeep<Pick<DiagramEdge, 'line' | 'dir' | 'tail' | 'head'>>;
type EdgePathProps = {
    edgeProps: BaseEdgePropsWithData<Data>;
    svgPath: string;
    /**
     * If true, the edge is being dragged (used to disable animations)
     */
    isDragging?: boolean;
    strokeWidth?: number;
    onEdgePointerDown?: PointerEventHandler<SVGGElement> | undefined;
};
export declare const EdgePath: import("react").ForwardRefExoticComponent<EdgePathProps & import("react").RefAttributes<SVGPathElement>>;
export {};
