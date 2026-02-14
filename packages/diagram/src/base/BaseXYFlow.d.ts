import { type ReactFlowProps } from '@xyflow/react';
import type { SetRequired, Simplify } from 'type-fest';
import type { ViewPadding } from '../LikeC4Diagram.props';
import { type XYBackground } from './Background';
import type { BaseEdge, BaseNode } from './types';
export type BaseXYFlowProps<NodeType extends BaseNode, EdgeType extends BaseEdge> = Simplify<{
    pannable: boolean;
    zoomable: boolean;
    nodesSelectable: boolean;
    nodesDraggable: boolean;
    background?: 'transparent' | 'solid' | XYBackground;
    fitViewPadding?: ViewPadding | undefined;
    onViewportResize?: undefined | (() => void);
} & SetRequired<Omit<ReactFlowProps<NodeType, EdgeType>, 'defaultNodes' | 'defaultEdges' | 'fitViewOptions' | 'nodesSelectable' | 'nodesDraggable'>, 'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange'>>;
export declare function BaseXYFlow<NodeType extends BaseNode, EdgeType extends BaseEdge>({ nodes, edges, onEdgesChange, onNodesChange, className, pannable, zoomable, nodesSelectable, nodesDraggable, background, children, colorMode, fitViewPadding, fitView, zoomOnDoubleClick, onViewportResize, onMoveEnd, onNodeMouseEnter, onNodeMouseLeave, onEdgeMouseEnter, onEdgeMouseLeave, ...props }: BaseXYFlowProps<NodeType, EdgeType>): import("react").JSX.Element;
