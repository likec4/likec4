import { type NavLinkProps } from '@mantine/core';
import type { ComponentPropsWithoutRef } from 'react';
export interface NavigationLinkProps extends Omit<NavLinkProps, 'classNames'>, Omit<ComponentPropsWithoutRef<'button'>, keyof NavLinkProps> {
    truncateLabel?: boolean;
}
export declare const NavigationLink: import("react").ForwardRefExoticComponent<NavigationLinkProps & import("react").RefAttributes<HTMLButtonElement>>;
