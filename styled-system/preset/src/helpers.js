"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alpha = alpha;
exports.rem = rem;
/**
 * Changes the alpha channel of a color
 * @param color color value or CSS variable
 * @param percentage Alpha channel value
 * @returns
 */
function alpha(color, percentage) {
    if (percentage === void 0) { percentage = 50; }
    var alpha = percentage;
    if (typeof percentage === 'number') {
        if (percentage > 0 && percentage < 1) {
            percentage *= 100;
        }
        alpha = "".concat(percentage, "%");
    }
    return "oklch(from ".concat(color, " l c h / ").concat(alpha, ")");
}
function rem(pixels) {
    // return `${(pixels / 16).toPrecision(3)}rem`
    return "".concat(pixels, "px");
}
