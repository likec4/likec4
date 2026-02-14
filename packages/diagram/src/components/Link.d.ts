import type { Link as LinkData } from '@likec4/core';
import { type BadgeProps } from '@mantine/core';
export declare const Link: import("react").ForwardRefExoticComponent<Omit<BadgeProps, "children" | "classNames"> & {
    value: LinkData;
} & import("react").RefAttributes<HTMLDivElement>>;
