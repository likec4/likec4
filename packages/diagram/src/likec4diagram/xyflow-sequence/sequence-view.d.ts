import { type BBox, type LayoutedDynamicView } from '@likec4/core/types';
import type { Types } from '../types';
export declare function sequenceViewToXY(view: LayoutedDynamicView): {
    bounds: BBox;
    xynodes: Array<Types.SequenceActorNode | Types.SequenceParallelArea | Types.ViewGroupNode>;
    xyedges: Array<Types.SequenceStepEdge>;
};
