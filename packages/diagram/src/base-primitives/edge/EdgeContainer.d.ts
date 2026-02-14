import type { DiagramEdge } from '@likec4/core/types';
import type { PropsWithChildren } from 'react';
import type { UndefinedOnPartialDeep } from 'type-fest';
import type { BaseEdgePropsWithData } from '../../base/types';
type Data = UndefinedOnPartialDeep<Pick<DiagramEdge, 'dir' | 'color'>>;
type EdgeContainerProps = PropsWithChildren<BaseEdgePropsWithData<Data> & {
    component?: 'g' | 'svg' | undefined;
    className?: string | undefined;
}>;
export declare function EdgeContainer({ className, component, selectable, selected, data: { color, hovered: isHovered, active: isActive, dimmed: isDimmed, ...data }, animated, children, style, }: EdgeContainerProps): import("react").JSX.Element;
export {};
