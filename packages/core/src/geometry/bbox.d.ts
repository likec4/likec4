import type { Point, XYPoint } from './types';
export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare const BBox: {
    center({ x, y, width, height }: BBox): XYPoint;
    /**
     * Returns the four corner points of the box in clockwise order starting from top-left
     */
    toPoints({ x, y, width, height }: BBox): [XYPoint, XYPoint, XYPoint, XYPoint];
    fromPoints(points: Point[]): BBox;
    merge(...boxes: BBox[]): BBox;
    fromRectBox(rect: RectBox): BBox;
    toRectBox(box: BBox): RectBox;
    expand(box: BBox, plus: number): BBox;
    shrink(box: BBox, minus: number): BBox;
    /**
     * Returns true if `a` includes `b` (i.e. `b` is inside `a`)
     */
    includes(a: BBox, b: BBox): boolean;
};
export interface RectBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export declare const RectBox: {
    center({ x1, y1, x2, y2 }: RectBox): XYPoint;
    fromPoints(points: Point[]): RectBox;
    merge(...boxes: RectBox[]): RectBox;
    toBBox(box: RectBox): BBox;
    /**
     * Returns true if `a` includes `b` (i.e. `b` is inside `a`)
     */
    includes(a: RectBox, b: RectBox): boolean;
};
