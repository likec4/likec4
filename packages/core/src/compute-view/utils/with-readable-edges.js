import { map, mapToObj, mapValues, omit } from 'remeda';
/**
 * Convert hashed edge ids to human-readable
 * Mostly for testing purposes
 */
export function withReadableEdges({ edges, nodes, ...view }, separator = ':') {
    const edgeids = mapToObj(edges, e => [e.id, `${e.source}${separator}${e.target}`]);
    return {
        ...view,
        edges: edges.map(e => ({
            ...e,
            id: edgeids[e.id],
        })),
        nodes: nodes.map(n => ({
            ...n,
            inEdges: map(n.inEdges, e => edgeids[e]),
            outEdges: map(n.outEdges, e => edgeids[e]),
        })),
        nodeIds: nodes.map(n => n.id),
        edgeIds: edges.map(e => edgeids[e.id]),
    };
}
export function viewsWithReadableEdges({ views, ...model }) {
    return {
        ...model,
        views: mapValues(views, v => omit(withReadableEdges(v), ['nodeIds', 'edgeIds'])),
    };
}
