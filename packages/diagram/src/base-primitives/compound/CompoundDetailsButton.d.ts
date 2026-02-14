import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { Simplify } from 'type-fest';
import type { BaseNodeProps } from '../../base/types';
type CompoundDetailsButtonProps = Simplify<BaseNodeProps & {
    icon?: ReactNode;
    onClick: (e: ReactMouseEvent) => void;
}>;
export declare function CompoundDetailsButton({ data: { hovered: isHovered, }, icon, onClick, }: CompoundDetailsButtonProps): import("react").JSX.Element;
export {};
