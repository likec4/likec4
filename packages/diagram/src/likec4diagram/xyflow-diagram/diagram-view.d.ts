import { type DiagramView, type ViewId, type WhereOperator } from '@likec4/core';
import type { Types } from '../types';
/**
 * Convert a diagram view to XY flow nodes and edges.
 * @param opts
 * @param opts.view - The diagram view to convert.
 * @param opts.currentViewId - The ID of the current view.
 * @param opts.where - Optional filter for nodes and edges.
 * @returns An object containing an array of XY flow nodes and an array of XY flow edges.
 */
export declare function diagramToXY(opts: {
    view: Pick<DiagramView, 'id' | 'nodes' | 'edges' | '_type' | 'autoLayout'>;
    currentViewId: ViewId | undefined;
    where: WhereOperator | null;
}): {
    xynodes: Types.Node[];
    xyedges: Types.Edge[];
};
