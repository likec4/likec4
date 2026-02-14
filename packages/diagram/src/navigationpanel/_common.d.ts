import { type NavigationPanelActionIconVariant } from '@likec4/styles/recipes';
import { type ActionIconProps } from '@mantine/core';
import type { HTMLMotionProps } from 'motion/react';
export declare const Tooltip: import("react").ForwardRefExoticComponent<import("@mantine/core").TooltipProps & import("react").RefAttributes<HTMLDivElement> & {
    component?: any;
    renderRoot?: (props: Record<string, any>) => React.ReactNode;
}>;
export declare const BreadcrumbsSeparator: () => import("react").JSX.Element;
export declare const Breadcrumbs: import("react").ForwardRefExoticComponent<import("@mantine/core").BreadcrumbsProps & import("react").RefAttributes<HTMLDivElement> & {
    component?: any;
    renderRoot?: (props: Record<string, any>) => React.ReactNode;
}>;
export type PanelActionIconProps = Partial<NavigationPanelActionIconVariant> & Omit<ActionIconProps, keyof NavigationPanelActionIconVariant> & Omit<HTMLMotionProps<'button'>, keyof NavigationPanelActionIconVariant>;
export declare const PanelActionIcon: import("react").ForwardRefExoticComponent<any>;
