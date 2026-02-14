import type * as t from '@likec4/core/types';
import type { CSSProperties, ReactNode } from 'react';
import type { JSX } from 'react/jsx-runtime';
import type { LikeC4DiagramEventHandlers, LikeC4DiagramProperties } from './LikeC4Diagram.props';
export type ReactLikeC4Props<A extends t.aux.Any = t.aux.UnknownLayouted> = {
    viewId: t.aux.ViewId<A>;
    /**
     * Layout to display
     * - `auto`: auto-layouted from the current sources
     * - `manual`: manually layouted (if available, falls back to `auto`)
     *
     * Uncontrolled initial value, use `onLayoutTypeChange` to control it.
     *
     * @default 'manual'
     */
    layoutType?: t.LayoutType | undefined;
    /**
     * Keep aspect ratio of the diagram
     *
     * @default false
     */
    keepAspectRatio?: boolean | undefined;
    /**
     * By default determined by the user's system preferences.
     */
    colorScheme?: 'light' | 'dark' | undefined;
    /**
     * LikeC4 views are using 'IBM Plex Sans Variable' font.
     * By default, component injects the CSS to document head.
     * Set to false if you want to handle the font yourself.
     *
     * @default true
     */
    injectFontCss?: boolean | undefined;
    style?: CSSProperties | undefined;
    mantineTheme?: any;
    /** Function to generate nonce attribute added to all generated `<style />` tags */
    styleNonce?: string | (() => string) | undefined;
    children?: ReactNode | undefined;
} & Omit<LikeC4DiagramProperties<A>, 'view'> & LikeC4DiagramEventHandlers<A>;
/**
 * Ready-to-use component to display embedded LikeC4 view, same as {@link LikeC4View}
 * But provides more control over the diagram
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export declare function ReactLikeC4<A extends t.aux.Any = t.aux.UnknownLayouted>({ viewId, layoutType: initialLayoutType, className, colorScheme, injectFontCss, enableNotations, keepAspectRatio, style, mantineTheme, styleNonce, ...props }: ReactLikeC4Props<A>): JSX.Element;
