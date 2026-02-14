import type * as t from '@likec4/core/types';
import type { CSSProperties, ReactNode } from 'react';
import type { JSX } from 'react/jsx-runtime';
import type { ElementIconRenderer, NodeRenderers, OverrideReactFlowProps, PaddingWithUnit, ViewPadding } from './LikeC4Diagram.props';
export interface LikeC4ViewProps<A extends t.aux.Any = t.aux.UnknownLayouted> {
    /**
     * View to display.
     */
    viewId: t.aux.ViewId<A>;
    /**
     * Layout to display
     * - `auto`: auto-layouted from the current sources
     * - `manual`: manually layouted (if available, falls back to `auto`)
     *
     * @default 'manual'
     */
    layoutType?: t.LayoutType | undefined;
    /**
     * Enable/disable panning
     * @default false
     */
    pannable?: boolean | undefined;
    /**
     * Enable/disable zooming
     * @default false
     */
    zoomable?: boolean | undefined;
    /**
     * @default true
     */
    keepAspectRatio?: boolean | undefined;
    /**
     * Background pattern
     * @default 'transparent'
     */
    background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined;
    /**
     * Click on the view opens a modal with browser.
     * You can customize or disable the browser.
     *
     * @default true
     */
    browser?: boolean | LikeC4BrowserProps | undefined;
    /**
     * @default - determined by the user's system preferences.
     */
    colorScheme?: 'light' | 'dark' | undefined;
    /**
     * LikeC4 views are using 'IBM Plex Sans' font.
     * By default, component injects the CSS to document head.
     * Set to false if you want to handle the font yourself.
     *
     * @default true
     */
    injectFontCss?: boolean | undefined;
    /**
     * Show/hide panel with top left controls,
     * @default false
     */
    controls?: boolean | undefined;
    /**
     * If set, initial viewport will show all nodes & edges
     * @default true
     */
    fitView?: boolean | undefined;
    /**
     * Padding around the diagram
     * @default '16px'
     *
     * @see {@link ViewPadding}
     *
     * @example
     * ```tsx
     * <LikeC4View
     *   fitViewPadding={{
     *     x: '16px',
     *     y: 16,
     *   }}
     * />
     *
     * <LikeC4View
     *   fitViewPadding={{
     *     top: 8,
     *     right: '8px',
     *     bottom: '1px',
     *     left: '8px',
     *   }}
     * />
     * ```
     */
    fitViewPadding?: ViewPadding | undefined;
    /**
     * Show back/forward navigation buttons in controls panel
     * @default false
     */
    showNavigationButtons?: undefined | boolean;
    /**
     * Display notations of the view
     * @default false
     */
    enableNotations?: boolean | undefined;
    /**
     * If double click on a node should enable focus mode, i.e. highlight incoming/outgoing edges
     * Conflicts with `browser` prop
     *
     * @default false
     */
    enableFocusMode?: boolean | undefined;
    /**
     * If Walkthrough for dynamic views should be enabled
     * @default false
     */
    enableDynamicViewWalkthrough?: boolean | undefined;
    /**
     * Default dynamic view display variant
     * @default 'diagram'
     */
    dynamicViewVariant?: t.DynamicViewDisplayVariant | undefined;
    /**
     * Enable popup with element details
     * @default false
     */
    enableElementDetails?: boolean | undefined;
    /**
     * Display element tags in the bottom left corner
     * @default false
     */
    enableElementTags?: boolean | undefined;
    /**
     * Display dropdown with details on relationship's label click
     * @default false
     */
    enableRelationshipDetails?: boolean | undefined;
    /**
     * Allow popup to browse relationships
     *
     * @default enableRelationshipDetails
     */
    enableRelationshipBrowser?: boolean | undefined;
    /**
     * Display element notes, if they are present in the view
     *
     * @default false
     */
    enableNotes?: boolean | undefined;
    /**
     * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
     *
     * @default 'auto' - will be set to true if view is pannable and has more than 3000 * 2000 pixels
     */
    reduceGraphics?: 'auto' | boolean | undefined;
    where?: t.WhereOperator<A> | undefined;
    /**
     * Override some react flow props
     */
    reactFlowProps?: OverrideReactFlowProps | undefined;
    className?: string | undefined;
    style?: CSSProperties | undefined;
    /**
     * Override Mantine theme
     */
    mantineTheme?: any;
    /** Function to generate nonce attribute added to all generated `<style />` tags */
    styleNonce?: string | (() => string) | undefined;
    /**
     * Override node renderers
     */
    renderNodes?: NodeRenderers | undefined;
    /**
     * Render custom icon for a node
     * By default, if icon is http:// or https://, it will be rendered as an image
     */
    renderIcon?: ElementIconRenderer | undefined;
    /**
     * Children to render inside the diagram (not inside the browser overlay)
     */
    children?: ReactNode | undefined;
}
export interface LikeC4BrowserProps {
    /**
     * Background pattern for the browser view.
     * @default 'dots'
     */
    background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined;
    /**
     * Padding around the diagram
     * @default '16px'
     */
    fitViewPadding?: PaddingWithUnit | undefined;
    /**
     * Show/hide panel with top left controls,
     *
     * @default true
     */
    controls?: boolean | undefined;
    /**
     * Show back/forward navigation buttons
     * @default true
     */
    showNavigationButtons?: undefined | boolean;
    /**
     * Enable search popup for elements and views
     * @default true
     */
    enableSearch?: boolean | undefined;
    /**
     * If double click on a node should enable focus mode
     *
     * @default true
     */
    enableFocusMode?: boolean | undefined;
    /**
     * If Walkthrough for dynamic views should be enabled
     * @default true
     */
    enableDynamicViewWalkthrough?: boolean | undefined;
    /**
     * Default dynamic view display variant
     * @default 'diagram'
     */
    dynamicViewVariant?: t.DynamicViewDisplayVariant | undefined;
    /**
     * Enable popup with element details
     * @default true
     */
    enableElementDetails?: boolean | undefined;
    /**
     * Experimental feature to browse relationships
     *
     * @default true
     */
    enableRelationshipBrowser?: boolean | undefined;
    /**
     * Display dropdown with details on relationship's label click
     * @default enableRelationshipBrowser
     */
    enableRelationshipDetails?: boolean | undefined;
    /**
     * Display element tags in the bottom left corner
     * @default true
     */
    enableElementTags?: boolean | undefined;
    /**
     * Display notations of the view
     * @default true
     */
    enableNotations?: boolean | undefined;
    /**
     * Enable "Compare with auto layout" action when view was manually modified and out of sync with latest model
     * @default true
     */
    enableCompareWithLatest?: boolean | undefined;
    /**
     * Display element notes, if they are present in the view
     *
     * @default true
     */
    enableNotes?: boolean | undefined;
    /**
     * Improve performance by hiding certain elements and reducing visual effects (disable mix-blend, shadows, animations)
     *
     * @default 'auto' - will be set to true if view is pannable and has more than 3000 * 2000 pixels
     */
    reduceGraphics?: 'auto' | boolean | undefined;
    className?: string | undefined;
    style?: CSSProperties | undefined;
    /**
     * Override some react flow props
     */
    reactFlowProps?: OverrideReactFlowProps | undefined;
    /**
     * Children to render inside the browser overlay
     */
    children?: ReactNode | undefined;
}
/**
 * Ready-to-use component to display embedded LikeC4 view,
 * OnClick allows to browse the model.
 *
 * {@link ReactLikeC4} gives you more control.
 *
 * Component is wrapped in ShadowRoot to isolate styles.
 */
export declare function LikeC4View<A extends t.aux.Any = t.aux.UnknownLayouted>({ viewId, className, pannable, zoomable, keepAspectRatio, colorScheme, injectFontCss, controls, layoutType: initialLayoutType, background, browser, showNavigationButtons, enableNotations, enableFocusMode, enableDynamicViewWalkthrough, enableElementDetails, enableRelationshipDetails, enableRelationshipBrowser, enableNotes, reduceGraphics, mantineTheme, styleNonce, style, reactFlowProps, renderNodes, children, ...props }: LikeC4ViewProps<A>): JSX.Element;
