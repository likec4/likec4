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

    it('should return an empty box at origin for no inputs', () => {
      const result = BBox.merge()
      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      })
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

    it('should return a zero-sized box at origin for no inputs', () => {
      const result = RectBox.merge()
      expect(result).toEqual({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
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

    it('should return zero-sized box at origin for empty input', () => {
      const result = RectBox.fromPoints([])
      expect(result).toEqual({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
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
