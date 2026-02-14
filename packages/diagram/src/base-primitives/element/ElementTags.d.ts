import { type ComponentPropsWithoutRef } from 'react';
import type { BaseNodePropsWithData } from '../../base/types';
export type ElementTagProps = {
    tag: string;
    cursor?: 'pointer' | 'default';
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'color'>;
export declare const ElementTag: import("react").ForwardRefExoticComponent<{
    tag: string;
    cursor?: "pointer" | "default";
} & Omit<Omit<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref">, "children" | "color"> & import("react").RefAttributes<HTMLDivElement>>;
type Data = {
    tags: readonly string[] | null | undefined;
    width: number;
};
export type ElementTagsProps = BaseNodePropsWithData<Data> & {
    onTagClick?: (tag: `#${string}`) => void;
    onTagMouseEnter?: (tag: `#${string}`) => void;
    onTagMouseLeave?: (tag: `#${string}`) => void;
};
export declare const ElementTags: import("react").MemoExoticComponent<({ id, data: { tags, width, hovered }, onTagClick, onTagMouseEnter, onTagMouseLeave }: ElementTagsProps) => import("react").JSX.Element>;
export {};
