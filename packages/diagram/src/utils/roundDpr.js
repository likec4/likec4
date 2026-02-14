"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundDpr = roundDpr;
var remeda_1 = require("remeda");
/**
 * Returns the current device pixel ratio (DPR) given the passed options
 *
 * @param options
 * @returns current device pixel ratio
 */
function getDevicePixelRatio() {
    var hasDprProp = typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number';
    var dpr = hasDprProp ? window.devicePixelRatio : 1;
    return (0, remeda_1.clamp)(Math.floor(dpr), {
        min: 1,
        max: 4,
    });
}
var knownDpr;
function roundDpr(v) {
    knownDpr !== null && knownDpr !== void 0 ? knownDpr : (knownDpr = getDevicePixelRatio());
    if (knownDpr < 2) {
        return Math.round(v);
    }
    // https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
    return Math.round(v * knownDpr) / knownDpr;
}
