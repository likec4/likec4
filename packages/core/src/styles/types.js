import { ThemeColors, } from '@likec4/style-preset/defaults';
export { BorderStyles, ElementShapes, IconPositions, Sizes, ThemeColors, } from '@likec4/style-preset/defaults';
// reference: https://graphviz.org/docs/attr-types/arrowType/
export const RelationshipArrowTypes = [
    'none',
    'normal',
    'onormal',
    'dot',
    'odot',
    'diamond',
    'odiamond',
    'crow',
    'open',
    'vee',
];
export function isThemeColor(color) {
    return ThemeColors.includes(color);
}
export function isCustomColor(color) {
    return !isThemeColor(color);
}
