import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { BaseNodeData } from '../../base/types';
type ElementDetailsButtonProps = {
    selected?: boolean;
    data: BaseNodeData;
    icon?: ReactNode;
    onClick: (e: ReactMouseEvent) => void;
};
export declare function ElementDetailsButton({ selected, data: { hovered: isHovered, }, icon, onClick, }: ElementDetailsButtonProps): import("react").JSX.Element;
export {};
