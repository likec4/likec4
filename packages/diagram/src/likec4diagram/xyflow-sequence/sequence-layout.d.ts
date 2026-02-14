import type { LayoutedDynamicView, ViewId } from '@likec4/core/types';
import type { Types } from '../types';
/**
 * Converts a sequence layout to XY flow nodes and edges.
 * @param view The next dynamic view which contains the sequence layout.
 * @param currentViewId The ID of the current view (optional, used to exclude navigation to the current view)
 */
export declare function sequenceLayoutToXY(view: LayoutedDynamicView, currentViewId: ViewId | undefined): {
    xynodes: Array<Types.SequenceActorNode | Types.SequenceParallelArea | Types.ViewGroupNode>;
    xyedges: Array<Types.SequenceStepEdge>;
};
