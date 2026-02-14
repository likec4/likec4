export function areOverlap(a, b) {
    ;
    [a, b] = compareRanges(a, b) > 0 ? [b, a] : [a, b];
    return isInRagne(a.range, b.range.start);
}
export function compareRanges(a, b) {
    const lineDiff = a.range.start.line - b.range.start.line;
    return lineDiff !== 0 ? lineDiff : a.range.start.character - b.range.start.character;
}
export function isInRagne(range, pos) {
    return !(pos.line < range.start.line
        || pos.line > range.end.line
        || pos.line == range.start.line && pos.character < range.start.character
        || pos.line == range.end.line && pos.character > range.end.character);
}
export function isMultiline(node) {
    return !!node && node.range.start.line != node.range.end.line;
}
