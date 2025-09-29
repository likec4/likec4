import {
  type LikeC4StyleDefaults,
  BorderStyles,
  ElementShapes,
  RelationshipArrowTypes,
  Sizes,
} from '@likec4/core/styles'
import { type ExpectStatic, describe, it } from 'vitest'
import { defineStyle, defineThemeColor } from './define-config'
import type { LikeC4StylesConfigInput } from './schema.theme'

// Utility to get a valid enum value safely
const first = <T>(arr: ReadonlyArray<T>): T => arr[0]!

const themecolorValues = (expect: ExpectStatic) => ({
  elements: {
    fill: expect.any(String),
    stroke: expect.any(String),
    hiContrast: expect.any(String),
    loContrast: expect.any(String),
  },
  relationships: {
    line: expect.any(String),
    label: expect.any(String),
    labelBg: expect.any(String),
  },
})

describe('LikeC4StylesConfig', () => {
  describe('defineStyle', () => {
    it('should accept empty object and transform to styles config with undefined theme/defaults', ({ expect }) => {
      const result = defineStyle({})
      expect(result).not.toHaveProperty('theme')
      expect(result).not.toHaveProperty('defaults')
    })

    it('should support explicit theme color values and set default relationship.labelBg', ({ expect }) => {
      const explicitColors = {
        elements: {
          fill: '#111111',
          stroke: '#222222',
          hiContrast: '#333333',
          loContrast: '#444444',
        },
        relationships: {
          line: '#555555',
          label: '#666666',
          // labelBg is optional, schema provides default rgba(0, 0, 0, 0)
        },
      }

      const result = defineStyle({
        theme: {
          colors: {
            primary: explicitColors,
            red2: '#FF0000',
          },
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const theme = result.theme!
      expect(theme).toBeDefined()
      expect(theme).toHaveProperty('colors.primary.elements', explicitColors.elements)
      expect(theme).toHaveProperty('colors.primary.relationships.line', '#555555')
      expect(theme).toHaveProperty('colors.primary.relationships.label', '#666666')
      // default should be injected by schema
      expect(theme).toHaveProperty('colors.primary.relationships.labelBg', 'rgba(0, 0, 0, 0)')
      // red2 should be parsed
      expect(theme).toHaveProperty('colors.red2', themecolorValues(expect))
    })

    it('should normalize defaults and preserve nested partials', ({ expect }) => {
      const defaults = {
        color: 'primary',
        opacity: 50,
        border: first(BorderStyles),
        size: first(Sizes),
        shape: first(ElementShapes),
        group: {
          color: 'secondary',
          opacity: 80,
        },
        relationship: {
          color: 'primary',
          line: 'dotted',
          arrow: first(RelationshipArrowTypes),
        },
      } satisfies LikeC4StylesConfigInput['defaults']

      const r = defineStyle({ defaults }).defaults as LikeC4StyleDefaults
      expect(r).toBeDefined()
      expect(r.color).toBe('primary')
      expect(r.opacity).toBe(50)
      expect(r.border).toBe(defaults.border)
      expect(r.size).toBe(defaults.size)
      expect(r.shape).toBe(defaults.shape)
      expect(r.group).toEqual({ color: 'secondary', opacity: 80 })
      expect(r.relationship).toEqual(defaults.relationship)
    })
  })

  describe('defineThemeColor', () => {
    it('should accept a ColorLiteral string and transform to ThemeColorValues object', ({ expect }) => {
      const p = defineThemeColor('#abcdef')
      expect(p).toMatchObject(themecolorValues(expect))
    })

    it('should pass-through an explicit object with element and relationship color values', ({ expect }) => {
      const input = {
        elements: {
          fill: '#101010',
          stroke: '#202020',
          hiContrast: '#303030',
          loContrast: '#404040',
        },
        relationships: {
          line: '#505050',
          label: '#606060',
        },
      }

      const parsed = defineThemeColor(input)
      // labelBg should be added by default in RelationshipColorValuesSchema
      expect(parsed.relationships).toEqual({
        line: '#505050',
        label: '#606060',
        labelBg: 'rgba(0, 0, 0, 0)',
      })
      expect(parsed.elements).toEqual(input.elements)
    })
  })
})
