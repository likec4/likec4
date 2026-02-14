import type { RichTextOrEmpty as RichTextType } from '@likec4/core/types';
import type { JsxStyleProps } from '@likec4/styles/types';
import { type ComponentPropsWithoutRef } from 'react';
export type MarkdownProps = Omit<ComponentPropsWithoutRef<'div'>, 'dangerouslySetInnerHTML' | 'children' | 'color'> & {
    value: RichTextType;
    /**
     * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
     * @default false
     */
    uselikec4palette?: boolean;
    /**
     * Scale factor for the block
     * @default 1
     */
    textScale?: number;
    /**
     * Font size for the block
     * @default 'md'
     */
    fontSize?: (JsxStyleProps['fontSize'] & string) | undefined;
    /**
     * If true, the component will not render anything if the value is empty.
     * @default false
     */
    hideIfEmpty?: boolean | undefined;
    /**
     * Text to show if the value is empty.
     * @default "no content"
     */
    emptyText?: string;
};
export declare const Markdown: import("react").ForwardRefExoticComponent<Omit<Omit<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref">, "dangerouslySetInnerHTML" | "children" | "color"> & {
    value: RichTextType;
    /**
     * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
     * @default false
     */
    uselikec4palette?: boolean;
    /**
     * Scale factor for the block
     * @default 1
     */
    textScale?: number;
    /**
     * Font size for the block
     * @default 'md'
     */
    fontSize?: (JsxStyleProps["fontSize"] & string) | undefined;
    /**
     * If true, the component will not render anything if the value is empty.
     * @default false
     */
    hideIfEmpty?: boolean | undefined;
    /**
     * Text to show if the value is empty.
     * @default "no content"
     */
    emptyText?: string;
} & import("react").RefAttributes<HTMLDivElement>>;
