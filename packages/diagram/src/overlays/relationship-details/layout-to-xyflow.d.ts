import type { RelationshipDetailsTypes } from './_types';
import type { LayoutResult } from './layout';
export declare function layoutResultToXYFlow(layout: LayoutResult): {
    xynodes: RelationshipDetailsTypes.Node[];
    xyedges: RelationshipDetailsTypes.Edge[];
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};
