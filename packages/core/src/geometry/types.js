export function isPoint(point) {
    return Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number';
}
export function convertPoint(point) {
    if (isPoint(point)) {
        return { x: point[0], y: point[1] };
    }
    return [point.x, point.y];
}
