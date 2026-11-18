import { describe, expect, it } from 'vitest'
import { type NodeRect, getDistributer } from './distributors'

function n(id: string, x: number, y: number, width = 20, height = 20): NodeRect {
  return {
    id,
    x,
    y,
    width,
    height,
  }
}

describe('distributor', () => {
  describe('Horizontal', () => {
    it('should evenly space nodes between the outermost edges', () => {
      const nodes = [
        n('a', 0, 0),
        n('b', 30, 10),
        n('c', 100, 20),
      ]
      const distributor = getDistributer('Horizontal')

      distributor.computeLayout(nodes)

      expect(distributor.applyPosition(nodes[0]!)).toEqual({ x: 0 })
      expect(distributor.applyPosition(nodes[1]!)).toEqual({ x: 50 })
      expect(distributor.applyPosition(nodes[2]!)).toEqual({ x: 100 })
    })

    it('should take node widths into account', () => {
      const nodes = [
        n('a', 0, 0, 20),
        n('b', 20, 0, 40),
        n('c', 120, 0, 20),
      ]
      const distributor = getDistributer('Horizontal')

      distributor.computeLayout(nodes)

      // total occupied 80, span 140 => gap 30
      expect(distributor.applyPosition(nodes[0]!)).toEqual({ x: 0 })
      expect(distributor.applyPosition(nodes[1]!)).toEqual({ x: 50 })
      expect(distributor.applyPosition(nodes[2]!)).toEqual({ x: 120 })
    })

    it('should keep positions when less than 3 nodes', () => {
      const nodes = [n('a', 0, 0), n('b', 100, 0)]
      const distributor = getDistributer('Horizontal')

      distributor.computeLayout(nodes)

      expect(distributor.applyPosition(nodes[0]!)).toEqual({})
      expect(distributor.applyPosition(nodes[1]!)).toEqual({})
    })
  })

  describe('Vertical', () => {
    it('should evenly space nodes between the outermost edges', () => {
      const nodes = [
        n('a', 0, 100),
        n('b', 10, 30),
        n('c', 20, 0),
      ]
      const distributor = getDistributer('Vertical')

      distributor.computeLayout(nodes)

      expect(distributor.applyPosition(nodes[0]!)).toEqual({ y: 100 })
      expect(distributor.applyPosition(nodes[1]!)).toEqual({ y: 50 })
      expect(distributor.applyPosition(nodes[2]!)).toEqual({ y: 0 })
    })

    it('should take node heights into account', () => {
      const nodes = [
        n('a', 0, 0, 20, 20),
        n('b', 0, 20, 20, 40),
        n('c', 0, 120, 20, 20),
      ]
      const distributor = getDistributer('Vertical')

      distributor.computeLayout(nodes)

      expect(distributor.applyPosition(nodes[0]!)).toEqual({ y: 0 })
      expect(distributor.applyPosition(nodes[1]!)).toEqual({ y: 50 })
      expect(distributor.applyPosition(nodes[2]!)).toEqual({ y: 120 })
    })
  })
})
