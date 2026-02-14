import chroma from 'chroma-js';
import { map, pipe, zip } from 'remeda';
import { invariant } from '../utils';
/**
 * Compute color values for compound nodes (for six depth levels)
 *
 * @param base The base element colors
 */
export function computeCompoundColorValues(base, depth) {
    const d = depth ?? 6;
    let fill = chroma(base.fill);
    let stroke = chroma(base.stroke);
    const isFillTooLight = fill.luminance() > 0.8;
    const fills = chroma
        .scale(isFillTooLight
        ? [fill.darken(0.02).desaturate(0.05), fill.darken(0.1).desaturate(0.1)]
        : [fill.shade(0.12, 'lch').desaturate(0.05), fill.shade(0.35, 'lch').desaturate(0.4)])
        .mode('oklch')
        .correctLightness()
        .colors(d, null);
    const strokes = chroma
        .scale(isFillTooLight
        ? [stroke.darken(0.04).desaturate(0.05), stroke.darken(0.12).desaturate(0.1)]
        : [stroke.shade(0.15, 'lch').desaturate(0.08), stroke.shade(0.4, 'lch').desaturate(0.4)])
        .mode('oklch')
        .correctLightness()
        .colors(d, null);
    const colors = pipe(zip(fills, strokes), map(([fill, stroke]) => ({
        ...base,
        fill: fill.hex(),
        stroke: stroke.hex(),
    })));
    invariant(colors.length === d, `Expected ${d} colors, got ${colors.length}`);
    return colors;
}
