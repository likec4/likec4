import type { ViewChange } from '@likec4/core/types';
import type { DiagramContext } from './types';
export declare function createViewChange(parentContext: Pick<DiagramContext, 'view' | 'xynodes' | 'xyedges' | 'xystore'>): ViewChange.SaveViewSnapshot;
