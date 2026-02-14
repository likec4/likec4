import { type LayoutedView, type XYPoint } from '@likec4/core';
import { type NodeLookup } from '@xyflow/system';
import type { Types } from '../types';
import type { ActionArg, Context as DiagramContext } from './machine.setup';
export declare function lastClickedNode(params: {
    context: DiagramContext;
    event: {
        node: Types.Node;
    };
}): DiagramContext['lastClickedNode'];
export declare function mergeXYNodesEdges(context: Pick<DiagramContext, 'xynodes' | 'xyedges' | 'view'>, event: {
    view: LayoutedView;
    xynodes: Types.Node[];
    xyedges: Types.Edge[];
}): {
    xynodes: Types.Node[];
    xyedges: Types.Edge[];
    view: LayoutedView;
};
export declare function focusNodesEdges(context: DiagramContext): {
    xynodes: Types.Node<string>[];
    xyedges: Types.Edge<"relationship" | "seq-step">[];
};
export declare function updateNodeData({ context, event }: ActionArg): Partial<DiagramContext>;
export declare function updateEdgeData({ context, event }: ActionArg): Partial<DiagramContext>;
export declare function resetEdgeControlPoints(nodeLookup: NodeLookup, edge: Types.Edge): [XYPoint, XYPoint];
