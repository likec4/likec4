import { exact, isAutoLayoutDirection } from '@likec4/core';
import { decode, encode } from '@msgpack/msgpack';
import { fromBase64, toBase64 } from '@smithy/util-base64';
import { shallowEqual } from 'fast-equals';
import { AstUtils, CstUtils } from 'langium';
import { find, mapValues } from 'remeda';
import { logger, logWarnError } from '../logger';
const { getDocument } = AstUtils;
function pack({ nodes, edges, ...rest }) {
    return {
        ...rest,
        nodes: mapValues(nodes, ({ x, y, width, height, isCompound, ...n }) => ({
            ...n,
            b: [x, y, width, height],
            c: isCompound,
        })),
        edges: mapValues(edges, ({ points, controlPoints, labelBBox, ...e }) => ({
            ...!!controlPoints && { cp: controlPoints },
            ...!!labelBBox && { l: labelBBox },
            ...e,
            p: points,
        })),
    };
}
function unpack({ nodes, edges, autoLayout, ...rest }) {
    return {
        ...rest,
        /// Try to parse the old format for backward compatibility
        autoLayout: isAutoLayoutDirection(autoLayout) ? { direction: autoLayout } : autoLayout,
        nodes: mapValues(nodes, ({ b, c, ...n }) => ({
            x: b[0],
            y: b[1],
            width: b[2],
            height: b[3],
            isCompound: c,
            ...n,
        })),
        edges: mapValues(edges, ({ p, cp, l, ...e }) => ({
            ...!!cp && { controlPoints: cp },
            ...!!l && { labelBBox: l },
            ...e,
            points: p,
        })),
    };
}
const MAX_LINE_LENGTH = 500;
export function serializeToComment(layout) {
    const bytes = encode(pack(layout));
    const base64 = toBase64(bytes);
    const lines = [];
    let offset = 0;
    while (offset < base64.length) {
        lines.push(' * ' + base64.slice(offset, Math.min(offset + MAX_LINE_LENGTH, base64.length)));
        offset += MAX_LINE_LENGTH;
    }
    lines.unshift('/**', ' * @likec4-generated(v1)');
    lines.push(' */');
    return lines.join('\n');
}
export function hasManualLayout(comment) {
    return comment.includes('@likec4-generated');
}
export function deserializeFromComment(comment) {
    if (!hasManualLayout(comment)) {
        throw new Error(`Not a likec4-generated comment: ${comment}`);
    }
    const b64 = comment
        .trim()
        .split('\n')
        .filter(l => !l.includes('**') && !l.includes('@likec4-') && !l.includes('*/'))
        .map(l => l.replaceAll('*', '').trim())
        .join('');
    const decodedb64 = fromBase64(b64);
    return unpack(decode(decodedb64));
}
export function parseViewManualLayout(node) {
    const commentNode = CstUtils.findCommentNode(node.$cstNode, ['BLOCK_COMMENT']);
    if (!commentNode || !hasManualLayout(commentNode.text)) {
        return undefined;
    }
    try {
        return deserializeFromComment(commentNode.text);
    }
    catch (e) {
        const doc = getDocument(node);
        logWarnError(e);
        logger.warn(`Ignoring manual layout of "${node.name ?? 'unnamed'}" at ${doc.uri.fsPath}:${1 + (commentNode.range.start.line || 0)}`);
        return undefined;
    }
}
/**
 * Applies styles from the latest layout to the manual layout
 * @param manualLayouted
 * @param latest
 */
export function applyStylesToManualLayout(manualLayouted, latest) {
    const nodes = manualLayouted.nodes.map(n => {
        const latestNode = find(latest.nodes, l => l.id === n.id);
        if (!latestNode) {
            return n;
        }
        const color = latestNode.color;
        if (color !== n.color) {
            n = {
                ...n,
                color,
            };
        }
        const { opacity, border } = latestNode.style;
        if (opacity !== n.style.opacity || border !== n.style.border) {
            n = {
                ...n,
                style: exact({
                    ...n.style,
                    opacity,
                    border,
                }),
            };
        }
        return n;
    });
    const edges = manualLayouted.edges.map(e => {
        const latestEdge = find(latest.edges, l => l.id === e.id);
        if (!latestEdge) {
            return e;
        }
        if (latestEdge.color !== e.color) {
            e = {
                ...e,
                color: latestEdge.color,
            };
        }
        if (latestEdge.line !== e.line) {
            e = {
                ...e,
                line: latestEdge.line,
            };
        }
        return e;
    });
    if (!shallowEqual(manualLayouted.nodes, nodes) || !shallowEqual(manualLayouted.edges, edges)) {
        return {
            ...manualLayouted,
            nodes,
            edges,
        };
    }
    return manualLayouted;
}
