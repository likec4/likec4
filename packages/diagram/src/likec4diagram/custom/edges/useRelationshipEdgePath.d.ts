import type { XYPosition } from '@xyflow/react';
import type { Types } from '../../types';
/**
 * @returns SVG path data string for relationship edge
 */
export declare function useRelationshipEdgePath({ props: { sourceX, sourceY, source, target, targetX, targetY, data, }, controlPoints, isControlPointDragging, }: {
    props: Types.EdgeProps<'relationship'>;
    controlPoints: XYPosition[];
    isControlPointDragging: boolean;
}): string;
