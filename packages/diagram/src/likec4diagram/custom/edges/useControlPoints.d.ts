import type { XYPosition } from '@xyflow/react';
import type { Types } from '../../types';
export declare function useControlPoints({ sourceX, sourceY, targetX, targetY, data, }: Types.EdgeProps<'relationship'>): {
    controlPoints: XYPosition[];
    setControlPoints: import("react").Dispatch<import("react").SetStateAction<XYPosition[]>>;
    insertControlPoint: ({ x, y }: XYPosition) => XYPosition[];
};
