import type { LikeC4Model } from '@likec4/core/model';
import { type Fqn } from '@likec4/core/types';
import { type ElementProps, type UnstyledButtonProps } from '@mantine/core';
export declare const NothingFound: () => import("react").JSX.Element;
export declare const ViewsColumn: import("react").MemoExoticComponent<() => import("react").JSX.Element>;
export declare function ViewButton({ className, view, loop, search, focusOnElement, currentViewId, ...props }: {
    view: LikeC4Model.View;
    currentViewId: string;
    search: string;
    loop?: boolean;
    focusOnElement?: Fqn;
} & UnstyledButtonProps & ElementProps<'button'>): import("react").JSX.Element;
