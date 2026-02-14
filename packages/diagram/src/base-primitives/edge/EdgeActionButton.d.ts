import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
type EdgeActionBtnProps = {
    icon?: ReactNode;
    onClick: (e: ReactMouseEvent) => void;
};
export declare function EdgeActionButton({ icon, onClick }: EdgeActionBtnProps): import("react").JSX.Element;
export {};
