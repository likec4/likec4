import { describe, expect, it } from 'vitest'
import { GridAligner, type NodeRect } from './aligners'

const placementError = 5

function n(id: string, x: number, y: number, width = 20, height = 20): NodeRect {
  return {
    id,
    x,
    y,
    width,
    height
  }
}

describe('aligners', () => {
  describe('GridAligner', () => {
    it('centers node if there is only one node in a row', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 80, 40)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[0]!)).toEqual({ x: 40, y: 0 })
      expect(aligner.applyPosition(nodeRects[1]!)).toEqual({ x: 40, y: 40 })
    })

    it('groups overlapping nodes in a row and aligns top', () => {
      const nodeRects = [
        n('a', 0, 10),
        n('b', 40, 20),
        n('c', 80, 30)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[0]!).y).toEqual(10)
      expect(aligner.applyPosition(nodeRects[1]!).y).toEqual(10)
      expect(aligner.applyPosition(nodeRects[2]!).y).toEqual(10)
    })

    it('spreads nodes in a row with equal space if this fits best to original layout', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 20, 0),
        n('c', 80, 0)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[0]!)).toEqual({ x: 0, y: 0 })
      expect(aligner.applyPosition(nodeRects[1]!)).toEqual({ x: 40, y: 0 })
      expect(aligner.applyPosition(nodeRects[2]!)).toEqual({ x: 80, y: 0 })
    })

    it('aligns with nodes in previous row if this fits best to original layout', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 40, 0),
        n('c', 80, 0),
        n('d', 120, 0),
        n('e', 40 + placementError, 40),
        n('f', 80 - placementError, 40)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[4]!)).toEqual({ x: 40, y: 40 })
      expect(aligner.applyPosition(nodeRects[5]!)).toEqual({ x: 80, y: 40 })
    })

    it('aligns with gaps in previous row if this fits best to original layout', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 40, 0),
        n('c', 80, 0),
        n('d', 120, 0),
        n('e', 20 + placementError, 40),
        n('f', 60 - placementError, 40)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[4]!)).toEqual({ x: 20, y: 40 })
      expect(aligner.applyPosition(nodeRects[5]!)).toEqual({ x: 60, y: 40 })
    })

    it('skips cell if previous layer has more cells than nodes in the current layer and it fits better', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 40, 0),
        n('c', 80, 0),
        n('d', 120, 0),
        n('e', 160, 0),
        n('f', 40 - placementError, 40),
        n('g', 80 - placementError, 40),
        n('h', 120 - placementError, 40),
        n('i', 160 - placementError, 40),
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[5]!)).toEqual({ x: 40, y: 40 })
      expect(aligner.applyPosition(nodeRects[6]!)).toEqual({ x: 80, y: 40 })
      expect(aligner.applyPosition(nodeRects[7]!)).toEqual({ x: 120, y: 40 })
      expect(aligner.applyPosition(nodeRects[8]!)).toEqual({ x: 155, y: 40 })
    })

    it('spreads rows evenly', () => {
      const nodeRects = [
        n('a', 0, 0),
        n('b', 0, 40),
        n('c', 0, 80),
        n('d', 0, 120),
        n('e', 40, 120),
        n('f', 0, 160)
      ]

      const aligner = new GridAligner('Row')

      aligner.computeLayout(nodeRects)

      expect(aligner.applyPosition(nodeRects[0]!).y).toEqual(0)
      expect(aligner.applyPosition(nodeRects[1]!).y).toEqual(40)
      expect(aligner.applyPosition(nodeRects[2]!).y).toEqual(80)
      expect(aligner.applyPosition(nodeRects[3]!).y).toEqual(120)
      expect(aligner.applyPosition(nodeRects[4]!).y).toEqual(120)
      expect(aligner.applyPosition(nodeRects[5]!).y).toEqual(160)
    })
  })
})
