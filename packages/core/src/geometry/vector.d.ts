export interface VectorValue {
    readonly x: number;
    readonly y: number;
}
export declare class Vector implements VectorValue {
    readonly x: number;
    readonly y: number;
    constructor(x: number, y: number);
    static create(position: VectorValue): Vector;
    static create(x: number, y: number): Vector;
    /**
     * Adds two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The sum of the two vectors.
     */
    static add(a: VectorValue, b: VectorValue): VectorValue;
    /**
     * Subtracts two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The difference of the two vectors.
     */
    static subtract(a: VectorValue, b: VectorValue): VectorValue;
    /**
     * Multiplies a vector by a scalar.
     * @param a The vector.
     * @param b The scalar.
     * @returns The scaled vector.
     */
    static multiply(a: VectorValue, b: number): VectorValue;
    /**
     * Divides a vector by a scalar.
     * @param a The vector.
     * @param b The scalar.
     * @returns The scaled vector.
     */
    static divide(a: VectorValue, b: number): VectorValue;
    /**
     * Calculates the dot product of the vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @returns The dot product.
     */
    static dot(a: VectorValue, b: VectorValue): number;
    /**
     * Adds the given vector to this vector.
     * @param b The vector to add.
     * @returns A new vector that is the sum of this vector and the given vector.
     */
    add(b: VectorValue): Vector;
    /**
     * Subtracts the given vector from this vector.
     * @param b The vector to subtract.
     * @returns A new vector that is the difference of this vector and the given vector.
     */
    subtract(b: VectorValue): Vector;
    /**
     * Multiplies this vector by a scalar.
     * @param b The scalar to multiply by.
     * @returns A new vector that is the product of this vector and the given scalar.
     */
    multiply(b: number): Vector;
    /**
     * Divides this vector by a scalar.
     * @param b The scalar to divide by.
     * @returns A new vector that is the quotient of this vector and the given scalar.
     */
    divide(b: number): Vector;
    /**
     * Calculates the dot product of this vector and another vector.
     * @param b The other vector.
     * @returns The dot product.
     */
    dot(b: VectorValue): number;
    /**
     * Calculates the cross product of this vector and another vector.
     * The cross product of two 2D vectors is a scalar value: a.x * b.y - a.y * b.x
     * @param b The other vector.
     * @returns The cross product as a scalar.
     */
    cross(b: VectorValue): number;
    /**
     * Calculates the length (magnitude) of this vector.
     * @returns The length of the vector.
     */
    length(): number;
    /**
     * Normalizes the vector (makes it unit length, i.e., has a length of 1).
     * @returns A new vector that is the normalized version of this vector.
     */
    normalize(): Vector;
    /**
     * Rounds the components of the vector to the nearest integers.
     * @returns A new vector with rounded components.
     */
    round(): Vector;
    /**
     * Truncates the components of the vector (removes the decimal part).
     * @returns A new vector with truncated components.
     */
    trunc(): Vector;
    /**
     * Converts the vector to a plain object.
     * @returns An object with x and y properties.
     */
    toObject(): VectorValue;
}
export declare function vector(source: VectorValue | Vector): Vector;
export declare function vector(x: number, y: number): Vector;
