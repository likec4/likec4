import { invariant } from '../utils';
export class Vector {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Runtime validation
        invariant(typeof x === 'number'
            && !isNaN(x)
            && isFinite(x)
            && typeof y === 'number'
            && !isNaN(y)
            && isFinite(y), `Invalid arguments for Vector: (${x}, ${y})`);
    }
    static create(...args) {
        if (args.length === 2) {
            return new Vector(args[0], args[1]);
        }
        return new Vector(args[0].x, args[0].y);
    }
    /**
     * Adds two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The sum of the two vectors.
     */
    static add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y };
    }
    /**
     * Subtracts two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The difference of the two vectors.
     */
    static subtract(a, b) {
        return { x: a.x - b.x, y: a.y - b.y };
    }
    /**
     * Multiplies a vector by a scalar.
     * @param a The vector.
     * @param b The scalar.
     * @returns The scaled vector.
     */
    static multiply(a, b) {
        return { x: a.x * b, y: a.y * b };
    }
    /**
     * Divides a vector by a scalar.
     * @param a The vector.
     * @param b The scalar.
     * @returns The scaled vector.
     */
    static divide(a, b) {
        return { x: a.x / b, y: a.y / b };
    }
    /**
     * Calculates the dot product of the vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The dot product.
     */
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    /**
     * Adds the given vector to this vector.
     * @param b The vector to add.
     * @returns A new vector that is the sum of this vector and the given vector.
     */
    add(b) {
        return new Vector(this.x + b.x, this.y + b.y);
    }
    /**
     * Subtracts the given vector from this vector.
     * @param b The vector to subtract.
     * @returns A new vector that is the difference of this vector and the given vector.
     */
    subtract(b) {
        return new Vector(this.x - b.x, this.y - b.y);
    }
    /**
     * Multiplies this vector by a scalar.
     * @param b The scalar to multiply by.
     * @returns A new vector that is the product of this vector and the given scalar.
     */
    multiply(b) {
        return new Vector(this.x * b, this.y * b);
    }
    /**
     * Divides this vector by a scalar.
     * @param b The scalar to divide by.
     * @returns A new vector that is the quotient of this vector and the given scalar.
     */
    divide(b) {
        return new Vector(this.x / b, this.y / b);
    }
    /**
     * Calculates the dot product of this vector and another vector.
     * @param b The other vector.
     * @returns The dot product.
     */
    dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    /**
     * Calculates the cross product of this vector and another vector.
     * The cross product of two 2D vectors is a scalar value: a.x * b.y - a.y * b.x
     * @param b The other vector.
     * @returns The cross product as a scalar.
     */
    cross(b) {
        return this.x * b.y - this.y * b.x;
    }
    /**
     * Calculates the length (magnitude) of this vector.
     * @returns The length of the vector.
     */
    length() {
        if (this.x === 0 && this.y === 0) {
            return 0;
        }
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    /**
     * Normalizes the vector (makes it unit length, i.e., has a length of 1).
     * @returns A new vector that is the normalized version of this vector.
     */
    normalize() {
        const len = this.length();
        if (len === 0) {
            return new Vector(0, 0);
        }
        return new Vector(this.x / len, this.y / len);
    }
    /**
     * Rounds the components of the vector to the nearest integers.
     * @returns A new vector with rounded components.
     */
    round() {
        return new Vector(Math.round(this.x), Math.round(this.y));
    }
    /**
     * Truncates the components of the vector (removes the decimal part).
     * @returns A new vector with truncated components.
     */
    trunc() {
        return new Vector(Math.trunc(this.x), Math.trunc(this.y));
    }
    /**
     * Converts the vector to a plain object.
     * @returns An object with x and y properties.
     */
    toObject() {
        return { x: this.x, y: this.y };
    }
}
export function vector(...args) {
    if (args.length === 1 && args[0] instanceof Vector) {
        return args[0];
    }
    if (args.length === 2) {
        return new Vector(args[0], args[1]);
    }
    return new Vector(args[0].x, args[0].y);
}
