import { _layout, _stage, } from '@likec4/core';
import { invariant } from '@likec4/core/utils';
import { logger } from '@likec4/log';
import { hasAtLeast, isTruthy } from 'remeda';
import { EDGE_LABEL_MAX_CHARS, EDGE_LABEL_MAX_LINES, wrap } from './dot-labels';
import { inchToPx, pointToPx } from './utils';
function parseBB(bb) {
    const [llx, lly, urx, ury] = bb
        ? bb.split(',').map(p => pointToPx(+p))
        : [0, 0, 0, 0];
    const width = Math.round(urx - llx);
    const height = Math.round(lly - ury);
    return {
        // x: llx - width / 2,
        // y: lly - height / 2,
        x: Math.round(llx),
        y: Math.round(ury),
        width,
        height,
    };
}
function parsePos(pos) {
    try {
        const [x, y] = pos.split(',');
        return {
            x: pointToPx(parseFloat(x)),
            y: pointToPx(parseFloat(y)),
        };
    }
    catch (e) {
        throw new Error(`Failed on parsing pos: ${pos}`, { cause: e });
    }
}
function parseNode(nodeObj) {
    // const cpos = prsePos(posStr, page)
    const { x, y } = parsePos(nodeObj.pos);
    const w = inchToPx(parseFloat(nodeObj.width));
    const h = inchToPx(parseFloat(nodeObj.height));
    return {
        x: x - Math.round(w / 2),
        y: y - Math.round(h / 2),
        width: w,
        height: h,
    };
}
function parseLabelBbox(labelDrawOps, [containerX, containerY] = [0, 0]) {
    if (!labelDrawOps || labelDrawOps.length === 0) {
        return null;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let fontSize = 13;
    try {
        for (const draw of labelDrawOps) {
            if (draw.op === 'F') {
                fontSize = pointToPx(draw.size);
                continue;
            }
            if (draw.op === 'T') {
                let x = pointToPx(draw.pt[0]) - containerX;
                let width = pointToPx(draw.width);
                switch (draw.align) {
                    case 'r':
                        x -= width;
                        break;
                    case 'c':
                        x -= Math.round(width / 2);
                        break;
                }
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x + width);
                let y = pointToPx(draw.pt[1]) - containerY;
                minY = Math.min(minY, Math.round(y - fontSize));
                maxY = Math.max(maxY, y);
            }
        }
    }
    catch (e) {
        logger.warn(`Failed on parsing label draw ops: \n{labelDrawOps}`, { e, labelDrawOps });
        return null;
    }
    // If no draw.op === 'T' found, return null
    if (minX === Infinity) {
        return null;
    }
    const padding = 2;
    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
    };
}
// Discussion:
//   https://forum.graphviz.org/t/how-to-interpret-graphviz-edge-coordinates-from-xdot-or-json/879/11
// Example:
//   https://github.com/hpcc-systems/Visualization/blob/trunk/packages/graph/workers/src/graphviz.ts#L38-L93
function parseEdgePoints({ _draw_, likec4_id = '???' }, viewId = '<unknown view>') {
    try {
        const bezierOps = _draw_.filter((v) => v.op.toLowerCase() === 'b');
        invariant(hasAtLeast(bezierOps, 1), `view ${viewId} edge ${likec4_id} should have at least one bezier draw op`);
        if (bezierOps.length > 1) {
            logger.warn(`view ${viewId} edge ${likec4_id} has more than one bezier draw op, using the first one only`);
        }
        const points = bezierOps[0].points.map(p => pointToPx(p));
        invariant(hasAtLeast(points, 2), `view ${viewId} edge ${likec4_id} should have at least two points`);
        return points;
    }
    catch (e) {
        throw new Error(`failed on parsing view ${viewId} edge ${likec4_id} _draw_:\n${JSON.stringify(_draw_, null, 2)}`, {
            cause: e,
        });
    }
}
function parseGraphvizEdge(graphvizEdge, { id, source, target, dir, label, description, ...computedEdge }, viewId) {
    const labelBBox = parseLabelBbox(graphvizEdge._ldraw_ ?? graphvizEdge._tldraw_ ?? graphvizEdge._hldraw_);
    const isBack = graphvizEdge.dir === 'back' || dir === 'back';
    label = (label && labelBBox)
        ? wrap(label, { maxchars: EDGE_LABEL_MAX_CHARS, maxLines: EDGE_LABEL_MAX_LINES }).join('\n')
        : null;
    return {
        id,
        source,
        target,
        label,
        ...isTruthy(description) && { description },
        points: parseEdgePoints(graphvizEdge, viewId),
        labelBBox,
        ...(isBack ? { dir: 'back' } : {}),
        ...computedEdge,
    };
}
export function parseGraphvizJson(graphvizJson, computedView) {
    const bounds = parseBB(graphvizJson.bb);
    const { nodes: computedNodes, edges: computedEdges, hasManualLayout, manualLayout: _manualLayout, // to omit
    ...view } = computedView;
    const nodes = [];
    const edges = [];
    let diagram;
    if (view._type === 'dynamic') {
        diagram = {
            ...view,
            sequenceLayout: {
                actors: [],
                compounds: [],
                parallelAreas: [],
                steps: [],
                bounds,
            },
            [_stage]: 'layouted',
            bounds,
            nodes,
            edges,
        };
    }
    else {
        diagram = {
            ...view,
            [_stage]: 'layouted',
            bounds,
            nodes,
            edges,
        };
    }
    // If the view has manual layout, we must indicate that current one is auto-layouted
    if (hasManualLayout) {
        const writableDiagram = diagram;
        writableDiagram[_layout] = 'auto';
    }
    const graphvizObjects = graphvizJson.objects ?? [];
    for (const computed of computedNodes) {
        const obj = graphvizObjects.find(o => o.likec4_id === computed.id);
        invariant(obj, `View ${view.id} node ${computed.id} not found in graphviz output`);
        try {
            const { x, y, width, height } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj);
            const position = [x, y];
            nodes.push({
                ...computed,
                x,
                y,
                width,
                height,
                labelBBox: parseLabelBbox(obj._ldraw_, position) ?? { x, y, width, height },
            });
        }
        catch (e) {
            throw new Error(`Failed on parsing node ${computed.id}:\n${JSON.stringify(obj, null, 2)}`, { cause: e });
        }
    }
    const graphvizEdges = graphvizJson.edges ?? [];
    for (const computedEdge of computedEdges) {
        const graphvizEdge = graphvizEdges.find(e => e.likec4_id === computedEdge.id);
        if (!graphvizEdge) {
            logger.warn `View ${view.id} edge ${computedEdge.id} not found in graphviz output, skipping`;
            continue;
        }
        edges.push(parseGraphvizEdge(graphvizEdge, computedEdge, view.id));
    }
    return diagram;
}
export function parseGraphvizJsonOfProjectsView(graphvizJson, computed) {
    // just cast, because we know that projects view is the same as layouted view
    // the only difference is that nodes/edges have projectId field
    // we have tests to ensure that
    return parseGraphvizJson(graphvizJson, computed);
}
