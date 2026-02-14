/**
 * Checks if tag color is defined in the specification
 * Expects HEX, `rgb(...)` or `rgba(...)` color
 */
export function isTagColorSpecified(spec) {
    const color = typeof spec === 'string' ? spec : spec.color;
    return color.startsWith('#') || color.startsWith('rgb');
}
