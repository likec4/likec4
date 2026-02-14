import type { DiagramView, DynamicViewDisplayVariant, WhereOperator } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
import type { ViewPaddings } from '../../LikeC4Diagram.props';
export declare function DiagramActorProvider({ id, view, zoomable, pannable, nodesDraggable, nodesSelectable, fitViewPadding, where, children, dynamicViewVariant: _defaultVariant, }: PropsWithChildren<{
    id: string;
    view: DiagramView;
    zoomable: boolean;
    pannable: boolean;
    nodesDraggable: boolean;
    nodesSelectable: boolean;
    fitViewPadding: ViewPaddings;
    where?: WhereOperator | null;
    dynamicViewVariant?: DynamicViewDisplayVariant | undefined;
}>): import("react").JSX.Element;
