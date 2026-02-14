import type { DynamicViewDisplayVariant, LayoutedView, ViewId, WhereOperator } from '@likec4/core/types';
import type { Types } from './types';
type ConvertToXYFlowInput = {
    currentViewId: ViewId | undefined;
    view: LayoutedView;
    where: WhereOperator | null;
    dynamicViewVariant: DynamicViewDisplayVariant;
};
export declare function convertToXYFlow({ dynamicViewVariant, ...params }: ConvertToXYFlowInput): {
    view: LayoutedView;
    xynodes: Types.Node[];
    xyedges: Types.Edge[];
};
export {};
