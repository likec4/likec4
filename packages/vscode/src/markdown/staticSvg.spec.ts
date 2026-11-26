import type { CustomColorDefinitions } from '@likec4/core/styles'
import { describe, expect, it } from 'vitest'
import { type StaticViewLike, ID_TOKEN, renderStaticSvg } from './staticSvg.ts'

describe('renderStaticSvg', () => {
  const sampleView: StaticViewLike = {
    id: 'index',
    _type: 'element',
    title: 'Shop <Overview>',
    bounds: { x: 0, y: 0, width: 400, height: 220 },
    nodes: [
      {
        x: 240,
        y: 40,
        width: 140,
        height: 120,
        level: 1,
        shape: 'storage',
        color: 'brand',
        title: { txt: 'Database & Cache' },
        technology: 'PostgreSQL',
        description: 'Stores orders',
      },
      {
        x: 10,
        y: 10,
        width: 380,
        height: 190,
        level: 0,
        children: ['api', 'db'],
        color: 'primary',
        title: 'Cloud Boundary',
      },
      {
        x: 30,
        y: 50,
        width: 140,
        height: 100,
        level: 1,
        shape: 'queue',
        color: 'primary',
        title: 'Event Bus',
      },
    ],
    edges: [
      {
        points: [
          [170, 100],
          [200, 100],
          [230, 100],
          [240, 100],
        ],
        line: 'dashed',
        label: 'writes',
        labelBBox: { x: 185, y: 80, width: 40, height: 18 },
      },
    ],
  }

  it('renders compound backgrounds before leaves, handles custom colors, and escapes labels', () => {
    const customColors: CustomColorDefinitions = {
      brand: {
        elements: { fill: '#112233', stroke: '#445566', hiContrast: '#ffffff', loContrast: '#dddddd' },
        relationships: { line: '#778899', labelBg: '#000000', label: '#ffffff' },
      },
    }
    const svg = renderStaticSvg(sampleView, 'diagram', 600, customColors)
    expect(svg).toContain('class="likec4-static"')
    expect(svg).toContain('data-bounds="0 0 400 220"')
    expect(svg).toContain('viewBox="-16 -16 432 252"')
    expect(svg).toContain('aria-label="Shop &lt;Overview&gt;"')
    expect(svg).toContain('#112233')
    expect(svg).toContain(ID_TOKEN)
    expect(svg.indexOf('CLOUD BOUNDARY')).toBeLessThan(svg.indexOf('Event Bus'))
    expect(svg).toContain('writes')
  })

  it('returns empty string for sequence variant of dynamic views or missing bounds', () => {
    expect(renderStaticSvg({ ...sampleView, _type: 'dynamic' }, 'sequence', 600)).toBe('')
    expect(renderStaticSvg({ id: 'empty' }, 'diagram', 600)).toBe('')
  })
})
