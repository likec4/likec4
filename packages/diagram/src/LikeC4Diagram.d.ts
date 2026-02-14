import type { Any } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
import type { JSX } from 'react/jsx-runtime';
import type { LikeC4DiagramEventHandlers, LikeC4DiagramProperties } from './LikeC4Diagram.props';
export type LikeC4DiagramProps<A extends Any = Any> = PropsWithChildren<LikeC4DiagramProperties<A> & LikeC4DiagramEventHandlers<A>>;
/**
 * Low-level component to display LikeC4 view
 * Expects CSS to be injected
 *
 * Use {@link ReactLikeC4} or {@link LikeC4View} for ready-to-use component
 */
export declare function LikeC4Diagram<A extends Any = Any>({ onCanvasClick, onCanvasContextMenu, onCanvasDblClick, onEdgeClick, onEdgeContextMenu, onNavigateTo, onNodeClick, onNodeContextMenu, onOpenSource, onLogoClick, onLayoutTypeChange, onInitialized, view, className, controls, fitView, fitViewPadding: _fitViewPadding, pannable, zoomable, background, enableElementTags, enableFocusMode, enableElementDetails, enableRelationshipDetails, enableRelationshipBrowser, enableCompareWithLatest, nodesSelectable, enableNotations, showNavigationButtons, enableDynamicViewWalkthrough, dynamicViewVariant, enableSearch, enableNotes, initialWidth, initialHeight, reduceGraphics, renderIcon, where, reactFlowProps, renderNodes, children, }: LikeC4DiagramProps<A>): JSX.Element;
