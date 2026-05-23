import type { TagSpecification } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { generateColorVars } from './TagStylesContext'

describe('generateColorVars', () => {
  it('emits all three CSS vars (bg, bg-hover, text) for a custom hex color and derives a high-contrast text color', () => {
    const spec: TagSpecification = { color: '#0066ff' }
    const css = generateColorVars(spec)

    expect(css).toContain('--colors-likec4-tag-bg: #0066ff;')
    expect(css).toContain('--colors-likec4-tag-bg-hover: color-mix(in oklab, #0066ff,')
    // text color is derived (not raw), starts with '#'
    expect(css).toMatch(/--colors-likec4-tag-text:\s*#[0-9a-fA-F]{6};/)
  })

  it('emits an explicit text color for dark custom backgrounds (light text expected)', () => {
    const css = generateColorVars({ color: '#000000' })
    expect(css).toMatch(/--colors-likec4-tag-text:\s*#[0-9a-fA-F]{6};/)
    const textMatch = css.match(/--colors-likec4-tag-text:\s*(#[0-9a-fA-F]{6});/)
    expect(textMatch).not.toBeNull()
    // For a black background, the derived text should be light (each channel > 0x99)
    const text = textMatch![1]!.toLowerCase()
    const r = parseInt(text.slice(1, 3), 16)
    const g = parseInt(text.slice(3, 5), 16)
    const b = parseInt(text.slice(5, 7), 16)
    expect(Math.min(r, g, b)).toBeGreaterThan(0x99)
  })

  it('emits an explicit text color for light custom backgrounds (dark text expected)', () => {
    const css = generateColorVars({ color: '#ffffff' })
    const textMatch = css.match(/--colors-likec4-tag-text:\s*(#[0-9a-fA-F]{6});/)
    expect(textMatch).not.toBeNull()
    const text = textMatch![1]!.toLowerCase()
    const r = parseInt(text.slice(1, 3), 16)
    const g = parseInt(text.slice(3, 5), 16)
    const b = parseInt(text.slice(5, 7), 16)
    expect(Math.max(r, g, b)).toBeLessThan(0x66)
  })

  it('still emits radix-based vars (including text) for a named tag color', () => {
    const css = generateColorVars({ color: 'tomato' as TagSpecification['color'] })
    expect(css).toContain('--colors-likec4-tag-bg: var(--colors-tomato-9);')
    expect(css).toContain('--colors-likec4-tag-bg-hover: var(--colors-tomato-10);')
    expect(css).toContain('--colors-likec4-tag-text: var(--colors-tomato-12);')
  })

  it('uses dark-2 text for radix backgrounds that are light at scale 9 (grass, lime, yellow, amber)', () => {
    for (const name of ['grass', 'lime', 'yellow', 'amber'] as const) {
      const css = generateColorVars({ color: name as TagSpecification['color'] })
      expect(css).toContain(`--colors-likec4-tag-text: var(--colors-${name}-dark-2);`)
    }
  })

  it('returns an empty string when the color is neither custom (hex/rgb) nor a known radix color', () => {
    const css = generateColorVars({ color: 'definitely-not-a-color' as TagSpecification['color'] })
    expect(css).toBe('')
  })
})
