import { invariant } from '@likec4/core/utils';
import { scale, toHex, transparentize } from 'khroma';
export function isCompound(node) {
    return node.children.length > 0;
}
export function toArrowType(type) {
    switch (type) {
        case 'open':
            return 'vee';
        default:
            return type;
    }
}
export function pointToPx(pt) {
    if (Array.isArray(pt)) {
        return [pointToPx(pt[0]), pointToPx(pt[1])];
    }
    invariant(isFinite(pt), `Invalid not finite point value ${pt}`);
    return Math.round(pt);
}
export const inchToPx = (inch) => {
    invariant(isFinite(inch), `Invalid not finite inch value ${inch}`);
    return Math.floor(inch * 72);
};
export const pxToInch = (px) => Math.ceil((px / 72) * 1000) / 1000;
export const pxToPoints = (px) => Math.ceil(px);
export const IconSizePoints = pxToPoints(40).toString();
export function compoundColor(color, depth) {
    return toHex(scale(color, {
        l: -35 - 5 * depth,
        s: -15 - 5 * depth,
    }));
}
export function compoundLabelColor(color) {
    return toHex(transparentize(color, 0.3));
}
