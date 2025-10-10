import { describe, expect, it } from 'vitest'
import { BBox, RectBox } from './geometry'

/**
 * Thanks to Windsurf for this test suite.
 */
describe('BBox', () => {
  describe('merge', () => {
    it('should merge multiple bounding boxes', () => {
      const box1: BBox = { x: 0, y: 0, width: 10, height: 10 }
      const box2: BBox = { x: 5, y: 5, width: 10, height: 10 }
      const box3: BBox = { x: -5, y: -5, width: 5, height: 5 }

      const result = BBox.merge(box1, box2, box3)

      expect(result).toEqual({
        x: -5,
        y: -5,
        width: 20, // 15 (from -5 to 10) + 5 (from 15 to 20)
        height: 20, // 15 (from -5 to 10) + 5 (from 15 to 20)
      })
    })

    it('should return a valid box for a single input', () => {
      const box: BBox = { x: 10, y: 20, width: 30, height: 40 }
      const result = BBox.merge(box)
      expect(result).toEqual(box)
    })

    it('should fail for no inputs', () => {
      expect(() => BBox.merge()).toThrow('No boxes provided')
    })
  })

  describe('toRectBox', () => {
    it('should convert BBox to RectBox correctly', () => {
      const bbox: BBox = { x: 10, y: 20, width: 30, height: 40 }
      const result = BBox.toRectBox(bbox)

      expect(result).toEqual({
        x1: 10,
        y1: 20,
        x2: 40, // x + width
        y2: 60, // y + height
      })
    })

    it('should handle negative coordinates correctly', () => {
      const bbox: BBox = { x: -10, y: -20, width: 30, height: 40 }
      const result = BBox.toRectBox(bbox)

      expect(result).toEqual({
        x1: -10,
        y1: -20,
        x2: 20, // -10 + 30
        y2: 20, // -20 + 40
      })
    })
  })

  describe('expand', () => {
    it('should expand the box by the given amount in all directions', () => {
      const box: BBox = { x: 10, y: 20, width: 30, height: 40 }
      const result = BBox.expand(box, 5)

      expect(result).toEqual({
        x: 5, // 10 - 5
        y: 15, // 20 - 5
        width: 40, // 30 + 2*5
        height: 50, // 40 + 2*5
      })
    })

    it('should return the same dimensions when expanding by 0', () => {
      const box: BBox = { x: 1, y: 2, width: 3, height: 4 }
      const result = BBox.expand(box, 0)
      expect(result).toEqual(box)
    })

    it('should behave like shrink when expanding with a negative value', () => {
      const box: BBox = { x: 10, y: 10, width: 20, height: 20 }
      const expandNeg = BBox.expand(box, -3)
      const shrinkPos = BBox.shrink(box, 3)
      expect(expandNeg).toEqual(shrinkPos)
    })
  })

  describe('shrink', () => {
    it('should shrink the box by the given amount in all directions', () => {
      const box: BBox = { x: 10, y: 20, width: 30, height: 40 }
      const result = BBox.shrink(box, 5)

      expect(result).toEqual({
        x: 15, // 10 + 5
        y: 25, // 20 + 5
        width: 20, // 30 - 2*5
        height: 30, // 40 - 2*5
      })
    })

    it('should return the same dimensions when shrinking by 0', () => {
      const box: BBox = { x: 1, y: 2, width: 3, height: 4 }
      const result = BBox.shrink(box, 0)
      expect(result).toEqual(box)
    })

    it('should allow negative width/height when shrinking beyond the box size', () => {
      const box: BBox = { x: 0, y: 0, width: 10, height: 10 }
      const result = BBox.shrink(box, 10)
      expect(result).toEqual({ x: 10, y: 10, width: -10, height: -10 })
    })

    it('should be the inverse of expand by the same amount', () => {
      const original: BBox = { x: 3, y: 4, width: 5, height: 6 }
      const expanded = BBox.expand(original, 7)
      const back = BBox.shrink(expanded, 7)
      expect(back).toEqual(original)
    })

    it('should invert shrink by expand with the same amount', () => {
      const original: BBox = { x: -3, y: -4, width: 50, height: 60 }
      const shrunk = BBox.shrink(original, 2)
      const back = BBox.expand(shrunk, 2)
      expect(back).toEqual(original)
    })
  })

  describe('includes', () => {
    it('should return true when bbox a completely includes bbox b', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const b: BBox = { x: 10, y: 10, width: 80, height: 80 }

      expect(BBox.includes(a, b)).toBe(true)
    })

    it('should return true when bboxes are identical', () => {
      const bbox: BBox = { x: 10, y: 20, width: 30, height: 40 }

      expect(BBox.includes(bbox, bbox)).toBe(true)
    })

    it('should return true when bbox b touches the edges of bbox a', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const b: BBox = { x: 0, y: 0, width: 100, height: 100 }

      expect(BBox.includes(a, b)).toBe(true)
    })

    it('should return false when bbox b extends beyond the left edge of bbox a', () => {
      const a: BBox = { x: 10, y: 10, width: 90, height: 90 }
      const b: BBox = { x: 5, y: 20, width: 80, height: 70 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should return false when bbox b extends beyond the right edge of bbox a', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const b: BBox = { x: 10, y: 10, width: 100, height: 80 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should return false when bbox b extends beyond the top edge of bbox a', () => {
      const a: BBox = { x: 0, y: 10, width: 100, height: 90 }
      const b: BBox = { x: 10, y: 5, width: 80, height: 80 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should return false when bbox b extends beyond the bottom edge of bbox a', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const b: BBox = { x: 10, y: 10, width: 80, height: 100 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should return false when bboxes only partially overlap', () => {
      const a: BBox = { x: 0, y: 0, width: 50, height: 50 }
      const b: BBox = { x: 25, y: 25, width: 50, height: 50 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should return false when bboxes do not overlap at all', () => {
      const a: BBox = { x: 0, y: 0, width: 50, height: 50 }
      const b: BBox = { x: 100, y: 100, width: 50, height: 50 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should handle negative coordinates correctly', () => {
      const a: BBox = { x: -100, y: -100, width: 200, height: 200 }
      const b: BBox = { x: -50, y: -50, width: 100, height: 100 }

      expect(BBox.includes(a, b)).toBe(true)
    })

    it('should return false when bbox b extends beyond negative boundaries', () => {
      const a: BBox = { x: -50, y: -50, width: 100, height: 100 }
      const b: BBox = { x: -60, y: -40, width: 100, height: 80 }

      expect(BBox.includes(a, b)).toBe(false)
    })

    it('should handle zero-area bboxes (points)', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const point: BBox = { x: 50, y: 50, width: 0, height: 0 }

      expect(BBox.includes(a, point)).toBe(true)
    })

    it('should return false when point is outside bbox', () => {
      const a: BBox = { x: 0, y: 0, width: 100, height: 100 }
      const point: BBox = { x: 150, y: 150, width: 0, height: 0 }

      expect(BBox.includes(a, point)).toBe(false)
    })
  })
})

describe('RectBox', () => {
  describe('merge', () => {
    it('should merge multiple rectangles', () => {
      const rect1: RectBox = { x1: 0, y1: 0, x2: 10, y2: 10 }
      const rect2: RectBox = { x1: 5, y1: 5, x2: 15, y2: 15 }
      const rect3: RectBox = { x1: -5, y1: -5, x2: 5, y2: 5 }

      const result = RectBox.merge(rect1, rect2, rect3)

      expect(result).toEqual({
        x1: -5,
        y1: -5,
        x2: 15,
        y2: 15,
      })
    })

    it('should return a valid rectangle for a single input', () => {
      const rect: RectBox = { x1: 10, y1: 20, x2: 30, y2: 40 }
      const result = RectBox.merge(rect)
      expect(result).toEqual(rect)
    })

    it('should fail for no inputs', () => {
      expect(() => RectBox.merge()).toThrow('No boxes provided')
    })
  })

  describe('fromPoints', () => {
    it('should create a box from points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 20],
        [5, 5],
        [-5, -5],
      ]

      const result = RectBox.fromPoints(points)

      expect(result).toEqual({
        x1: -5,
        y1: -5,
        x2: 10,
        y2: 20,
      })
    })
  })

  describe('fromPoints', () => {
    it('should create a box from points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 20],
        [5, 5],
        [-5, -5],
      ]

      const result = RectBox.fromPoints(points)

      expect(result).toEqual({
        x1: -5,
        y1: -5,
        x2: 10,
        y2: 20,
      })
    })

    it('should handle a single point', () => {
      const points: [number, number][] = [[5, 10]]
      const result = RectBox.fromPoints(points)
      expect(result).toEqual({
        x1: 5,
        y1: 10,
        x2: 5,
        y2: 10,
      })
    })

    it('should fail for empty input', () => {
      expect(() => RectBox.fromPoints([])).toThrow('At least one point is required')
    })
  })

  describe('toBBox', () => {
    it('should convert RectBox to BBox correctly', () => {
      const rect: RectBox = { x1: 10, y1: 20, x2: 40, y2: 60 }
      const result = RectBox.toBBox(rect)

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
      })
    })
  })

  describe('toBBox', () => {
    it('should convert RectBox to BBox correctly', () => {
      const rect: RectBox = { x1: 10, y1: 20, x2: 40, y2: 60 }
      const result = RectBox.toBBox(rect)

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 30, // x2 - x1
        height: 40, // y2 - y1
      })
    })

    it('should handle negative coordinates correctly', () => {
      const rect: RectBox = { x1: -10, y1: -20, x2: 20, y2: 20 }
      const result = RectBox.toBBox(rect)

      expect(result).toEqual({
        x: -10,
        y: -20,
        width: 30, // 20 - (-10)
        height: 40, // 20 - (-20)
      })
    })
  })

  describe('includes', () => {
    it('should return true when rectangle a completely includes rectangle b', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const b: RectBox = { x1: 10, y1: 10, x2: 90, y2: 90 }

      expect(RectBox.includes(a, b)).toBe(true)
    })

    it('should return true when rectangles are identical', () => {
      const rect: RectBox = { x1: 10, y1: 20, x2: 50, y2: 60 }

      expect(RectBox.includes(rect, rect)).toBe(true)
    })

    it('should return true when rectangle b touches the edges of rectangle a', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const b: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }

      expect(RectBox.includes(a, b)).toBe(true)
    })

    it('should return false when rectangle b extends beyond the left edge of rectangle a', () => {
      const a: RectBox = { x1: 10, y1: 10, x2: 100, y2: 100 }
      const b: RectBox = { x1: 5, y1: 20, x2: 90, y2: 90 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should return false when rectangle b extends beyond the right edge of rectangle a', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const b: RectBox = { x1: 10, y1: 10, x2: 110, y2: 90 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should return false when rectangle b extends beyond the top edge of rectangle a', () => {
      const a: RectBox = { x1: 0, y1: 10, x2: 100, y2: 100 }
      const b: RectBox = { x1: 10, y1: 5, x2: 90, y2: 90 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should return false when rectangle b extends beyond the bottom edge of rectangle a', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const b: RectBox = { x1: 10, y1: 10, x2: 90, y2: 110 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should return false when rectangles only partially overlap', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 50, y2: 50 }
      const b: RectBox = { x1: 25, y1: 25, x2: 75, y2: 75 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should return false when rectangles do not overlap at all', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 50, y2: 50 }
      const b: RectBox = { x1: 100, y1: 100, x2: 150, y2: 150 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should handle negative coordinates correctly', () => {
      const a: RectBox = { x1: -100, y1: -100, x2: 100, y2: 100 }
      const b: RectBox = { x1: -50, y1: -50, x2: 50, y2: 50 }

      expect(RectBox.includes(a, b)).toBe(true)
    })

    it('should return false when rectangle b extends beyond negative boundaries', () => {
      const a: RectBox = { x1: -50, y1: -50, x2: 50, y2: 50 }
      const b: RectBox = { x1: -60, y1: -40, x2: 40, y2: 40 }

      expect(RectBox.includes(a, b)).toBe(false)
    })

    it('should handle zero-area rectangles (points)', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const point: RectBox = { x1: 50, y1: 50, x2: 50, y2: 50 }

      expect(RectBox.includes(a, point)).toBe(true)
    })

    it('should return false when point is outside rectangle', () => {
      const a: RectBox = { x1: 0, y1: 0, x2: 100, y2: 100 }
      const point: RectBox = { x1: 150, y1: 150, x2: 150, y2: 150 }

      expect(RectBox.includes(a, point)).toBe(false)
    })
  })
})

describe('BBox and RectBox conversion', () => {
  it('should convert back and forth between BBox and RectBox', () => {
    const originalBBox: BBox = { x: 10, y: 20, width: 30, height: 40 }

    // Convert BBox to RectBox and back
    const rectBox = BBox.toRectBox(originalBBox)
    const convertedBack = RectBox.toBBox(rectBox)

    expect(convertedBack).toEqual(originalBBox)
  })

  it('should maintain precision during conversions', () => {
    const originalRect: RectBox = { x1: 10.5, y1: 20.75, x2: 40.25, y2: 60.1 }

    // Convert RectBox to BBox and back
    const bbox = RectBox.toBBox(originalRect)
    const convertedBack = BBox.toRectBox(bbox)

    // The values should be very close to the original, but might have floating point precision differences
    expect(convertedBack.x1).toBeCloseTo(originalRect.x1)
    expect(convertedBack.y1).toBeCloseTo(originalRect.y1)
    expect(convertedBack.x2).toBeCloseTo(originalRect.x2)
    expect(convertedBack.y2).toBeCloseTo(originalRect.y2)
  })
})
