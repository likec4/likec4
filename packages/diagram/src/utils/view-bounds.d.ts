import { BBox } from '@likec4/core/geometry';
import type { DiagramEdge, DynamicViewDisplayVariant, LayoutedView } from '@likec4/core/types';
/**
 * Picks appropriate bounds from the view,
 * depending on its type and dynamic variant
 */
export declare function pickViewBounds(view: LayoutedView, dynamicVariant?: DynamicViewDisplayVariant): BBox;
export declare function calcEdgeBounds({ points, controlPoints, labelBBox }: Pick<DiagramEdge, 'points' | 'controlPoints' | 'labelBBox'>): BBox;
export declare function calcViewBounds({ nodes, edges }: Pick<LayoutedView, 'nodes' | 'edges'>): BBox;
