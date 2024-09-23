export interface Vector {
  x: number
  y: number
}

export class VectorImpl implements Vector {
  constructor(public x: number, public y: number) {}

  static create(position: Vector): VectorImpl {
    return new VectorImpl(position.x, position.y)
  }

  static add(a: Vector, b: Vector): Vector {
    return { x: a.x + b.x, y: a.y + b.y }
  }
  static sub(a: Vector, b: Vector): Vector {
    return { x: a.x - b.x, y: a.y - b.y }
  }
  static mul(a: Vector, b: number): Vector {
    return { x: a.x * b, y: a.y * b }
  }
  static dot(a: Vector, b: Vector): number {
    return a.x * b.x + a.y * b.y
  }
  static cross(a: Vector, b: Vector): VectorImpl {
    return new VectorImpl(a.y * b.x - a.x * b.y, a.x * b.y - a.y * b.x)
  }
  static setLength(a: Vector, length: number): Vector {
    return vector(a).setLength(length)
  }

  add(b: Vector): VectorImpl {
    return new VectorImpl(this.x + b.x, this.y + b.y)
  }
  sub(b: Vector): VectorImpl {
    return new VectorImpl(this.x - b.x, this.y - b.y)
  }
  mul(b: number): VectorImpl {
    return new VectorImpl(this.x * b, this.y * b)
  }
  dot(b: Vector): number {
    return this.x * b.x + this.y * b.y
  }
  cross(b: Vector): VectorImpl {
    return new VectorImpl(this.y * b.x - this.x * b.y, this.x * b.y - this.y * b.x)
  }
  abs(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  setLength(length: number): VectorImpl {
    return this.mul(length / this.abs())
  }
}

export function vector(source: Vector): VectorImpl {
  return VectorImpl.create(source)
}
