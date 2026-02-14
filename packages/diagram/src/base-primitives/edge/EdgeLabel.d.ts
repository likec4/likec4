import type { DiagramEdge } from '@likec4/core/types';
import type { HTMLMotionProps } from 'motion/react';
import { type ReactNode } from 'react';
import type { UndefinedOnPartialDeep } from 'type-fest';
import type { BaseEdgePropsWithData } from '../../base/types';
type Data = UndefinedOnPartialDeep<Pick<DiagramEdge, 'label' | 'technology'>>;
type EdgeLabelProps = HTMLMotionProps<'div'> & {
    children?: ReactNode;
    edgeProps: BaseEdgePropsWithData<Data>;
    pointerEvents?: 'all' | 'none';
};
export declare const EdgeLabel: import("react").ForwardRefExoticComponent<Omit<EdgeLabelProps, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
export {};
