import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { Simplify } from 'type-fest';
import type { BaseNodeProps } from '../../base/types';
type CompoundActionButtonProps = Simplify<BaseNodeProps & {
    icon?: ReactNode;
    onClick: (e: ReactMouseEvent) => void;
}>;
export declare function CompoundActionButton({ data: { hovered: isHovered, }, icon, onClick, }: CompoundActionButtonProps): import("react").JSX.Element;
export {};
