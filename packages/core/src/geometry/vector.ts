export interface VectorValue {
  readonly x: number
  readonly y: number
}

export class Vector implements VectorValue {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static create(position: VectorValue): Vector
  static create(x: number, y: number): Vector
  static create(...args: [VectorValue] | [number, number]): Vector {
    if (args.length === 2) {
      return new Vector(args[0], args[1])
    }
    return new Vector(args[0].x, args[0].y)
  }

  /**
   * Adds two vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @returns The sum of the two vectors.
   */
  static add(a: VectorValue, b: VectorValue): VectorValue {
    return { x: a.x + b.x, y: a.y + b.y }
  }
  /**
   * Subtracts two vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @returns The difference of the two vectors.
   */
  static subtract(a: VectorValue, b: VectorValue): VectorValue {
    return { x: a.x - b.x, y: a.y - b.y }
  }
  /**
   * Multiplies a vector by a scalar.
   * @param a The vector.
   * @param b The scalar.
   * @returns The scaled vector.
   */
  static multiply(a: VectorValue, b: number): VectorValue {
    return { x: a.x * b, y: a.y * b }
  }

  /**
   * Divides a vector by a scalar.
   * @param a The vector.
   * @param b The scalar.
   * @returns The scaled vector.
   */
  static divide(a: VectorValue, b: number): VectorValue {
    return { x: a.x / b, y: a.y / b }
  }

  /**
   * Calculates the dot product of the vectors.
   * @param a The first vector.
   * @param b The second vector.
   * @returns The dot product.
   */
  static dot(a: VectorValue, b: VectorValue): number {
    return a.x * b.x + a.y * b.y
  }

  /**
   * Adds the given vector to this vector.
   * @param b The vector to add.
   * @returns A new vector that is the sum of this vector and the given vector.
   */
  add(b: VectorValue): Vector {
    return new Vector(this.x + b.x, this.y + b.y)
  }

  /**
   * Subtracts the given vector from this vector.
   * @param b The vector to subtract.
   * @returns A new vector that is the difference of this vector and the given vector.
   */
  subtract(b: VectorValue): Vector {
    return new Vector(this.x - b.x, this.y - b.y)
  }

  /**
   * Multiplies this vector by a scalar.
   * @param b The scalar to multiply by.
   * @returns A new vector that is the product of this vector and the given scalar.
   */
  multiply(b: number): Vector {
    return new Vector(this.x * b, this.y * b)
  }

  /**
   * Divides this vector by a scalar.
   * @param b The scalar to divide by.
   * @returns A new vector that is the quotient of this vector and the given scalar.
   */
  divide(b: number): Vector {
    return new Vector(this.x / b, this.y / b)
  }

  /**
   * Calculates the dot product of this vector and another vector.
   * @param b The other vector.
   * @returns The dot product.
   */
  dot(b: VectorValue): number {
    return this.x * b.x + this.y * b.y
  }

  /**
   * Calculates the cross product of this vector and another vector.
   * The cross product of two 2D vectors is a scalar value: a.x * b.y - a.y * b.x
   * @param b The other vector.
   * @returns The cross product as a scalar.
   */
  cross(b: VectorValue): number {
    return this.x * b.y - this.y * b.x
  }

  /**
   * Calculates the length (magnitude) of this vector.
   * @returns The length of the vector.
   */
  length(): number {
    if (this.x === 0 && this.y === 0) {
      return 0
    }
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  /**
   * Normalizes the vector (makes it unit length, i.e., has a length of 1).
   * @returns A new vector that is the normalized version of this vector.
   */
  normalize(): Vector {
    const len = this.length()
    if (len === 0) {
      return new Vector(0, 0)
    }
    return new Vector(this.x / len, this.y / len)
  }

  /**
   * Rounds the components of the vector to the nearest integers.
   * @returns A new vector with rounded components.
   */
  round(): Vector {
    return new Vector(Math.round(this.x), Math.round(this.y))
  }

  /**
   * Converts the vector to a plain object.
   * @returns An object with x and y properties.
   */
  toObject(): VectorValue {
    return { x: this.x, y: this.y }
  }
}

export function vector(source: VectorValue | Vector): Vector
export function vector(x: number, y: number): Vector
export function vector(...args: [VectorValue | Vector] | [number, number]): Vector {
  if (args.length === 1 && args[0] instanceof Vector) {
    return args[0]
  }
  if (args.length === 2) {
    return new Vector(args[0], args[1])
  }
  return new Vector(args[0].x, args[0].y)
}
