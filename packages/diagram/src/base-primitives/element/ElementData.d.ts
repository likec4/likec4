import type { ComputedNodeStyle, MarkdownOrString, NodeId } from '@likec4/core';
import { type Color } from '@likec4/core/types';
import { type CSSProperties, type DetailedHTMLProps, type HTMLAttributes } from 'react';
type RequiredData = {
    id: NodeId;
    title: string;
    technology?: string | null | undefined;
    color: Color;
    style: ComputedNodeStyle;
    description?: MarkdownOrString | null | undefined;
    icon?: string | null;
};
export type ElementDataProps = {
    data: RequiredData;
};
type IconProps = {
    data: {
        id: string;
        title: string;
        icon?: string | null | undefined;
    };
    className?: string;
    style?: CSSProperties;
};
type SlotProps = {
    data: RequiredData;
    className?: string;
    style?: CSSProperties;
    [key: `data-${string}`]: string;
};
/**
 * Renders an element title, technology, description, and icon.
 *
 * @example
 * ```tsx
 * <ElementData {...nodeProps} />
 * ```
 * or
 * ```tsx
 * <ElementData.Root {...nodeProps} >
 *   <ElementData.Icon {...nodeProps} />
 *   <ElementData.Content>
 *     <ElementData.Title {...nodeProps} />
 *     <ElementData.Technology {...nodeProps} />
 *     <ElementData.Description {...nodeProps} />
 *   </ElementData.Content>
 * </ElementData.Root>
 * ```
 */
export declare function ElementData({ data }: ElementDataProps): import("react").JSX.Element;
export declare namespace ElementData {
    var Root: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & ElementDataProps & import("react").RefAttributes<HTMLDivElement>>;
    var Icon: ({ data, ...props }: IconProps) => import("react").JSX.Element;
    var Content: import("react").ForwardRefExoticComponent<Omit<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
    var Title: import("react").ForwardRefExoticComponent<SlotProps & import("react").RefAttributes<HTMLDivElement>>;
    var Technology: import("react").ForwardRefExoticComponent<((import("type-fest/source/merge-exclusive").Without<SlotProps, {
        children?: import("react").ReactNode | undefined;
    }> & {
        children?: import("react").ReactNode | undefined;
    }) | (import("type-fest/source/merge-exclusive").Without<{
        children?: import("react").ReactNode | undefined;
    }, SlotProps> & SlotProps)) & import("react").RefAttributes<HTMLDivElement>>;
    var Description: import("react").ForwardRefExoticComponent<SlotProps & import("react").RefAttributes<HTMLDivElement>>;
}
export {};
