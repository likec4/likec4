import { type PropsWithChildren } from 'react';
export type OverlayProps = PropsWithChildren<{
    fullscreen?: boolean | undefined;
    withBackdrop?: boolean | undefined;
    overlayLevel?: number;
    className?: string;
    classes?: {
        dialog?: string;
        body?: string;
    };
    backdrop?: {
        opacity?: number;
    };
    openDelay?: number;
    onClose: () => void;
    onClick?: never;
}>;
export declare const Overlay: import("react").ForwardRefExoticComponent<{
    fullscreen?: boolean | undefined;
    withBackdrop?: boolean | undefined;
    overlayLevel?: number;
    className?: string;
    classes?: {
        dialog?: string;
        body?: string;
    };
    backdrop?: {
        opacity?: number;
    };
    openDelay?: number;
    onClose: () => void;
    onClick?: never;
} & {
    children?: import("react").ReactNode | undefined;
} & import("react").RefAttributes<HTMLDialogElement>>;
