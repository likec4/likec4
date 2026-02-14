import { type Patches } from './__tests__/fixture';
export declare function testData<const Nodes, Edges>(patches?: Patches<Nodes, Edges>): {
    result: t.LayoutedView;
    resultNodes: {
        [x: string]: DiagramNode;
    };
    resultEdges: { [Id in ("edge1" | "edge2" | "edge3" | "edge4" | "edge5" | "edge6" | "edge7") | (Edges & string)]: DiagramEdge; };
    manual: LayoutedElementView;
    manualNodes: Record<Types.ToAux<any>, DiagramNode>;
    manualEdges: Record<"edge1" | "edge2" | "edge3" | "edge4" | "edge5" | "edge6" | "edge7", DiagramEdge>;
    latest: LayoutedElementView;
    latestNodes: {
        [x: string]: DiagramNode;
    };
    latestEdges: { [Id in ("edge1" | "edge2" | "edge3" | "edge4" | "edge5" | "edge6" | "edge7") | (Edges & string)]: DiagramEdge; };
};
