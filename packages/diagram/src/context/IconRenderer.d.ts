import type { ElementShape } from '@likec4/core';
import { type CSSProperties, type PropsWithChildren, type ReactNode } from 'react';
import type { ElementIconRenderer } from '../LikeC4Diagram.props';
/**
 * Provider for custom element icon renderers
 *
 * @example
 * ```tsx
 * const MyIconRenderer: ElementIconRenderer = ({ node }) => {
 *   return <div>{node.title}</div>
 * }
 *
 * <IconRendererProvider value={MyIconRenderer}>
 *   <LikeC4Diagram />
 * </IconRendererProvider>
 * ```
 */
export declare function IconRendererProvider({ value, children, }: PropsWithChildren<{
    value: ElementIconRenderer | null;
}>): import("react").JSX.Element;
export declare function IconRenderer({ element, className, style, }: {
    element?: {
        id: string;
        title: string;
        icon?: string | null | undefined;
    };
    className?: string | undefined;
    style?: CSSProperties | undefined;
}): ReactNode;
export declare function IconOrShapeRenderer({ element, className, style, }: {
    element: {
        id: string;
        title: string;
        shape: ElementShape;
        icon?: string | null | undefined;
    };
    className?: string;
    style?: CSSProperties | undefined;
}): import("react").JSX.Element;
