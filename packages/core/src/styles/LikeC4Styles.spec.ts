import { describe, it } from 'vitest'
import type { LikeC4ProjectStylesConfig } from '../types'
import { computeColorValues } from './compute-color-values'
import { LikeC4Styles } from './LikeC4Styles'
import type { CustomColorDefinitions } from './types'

describe('LikeC4Styles', () => {
  describe('from', () => {
    it('should return DEFAULT when both stylesConfig and customColors are empty', ({ expect }) => {
      const result = LikeC4Styles.from(undefined, undefined)
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should return DEFAULT when stylesConfig is empty object', ({ expect }) => {
      const result = LikeC4Styles.from({}, undefined)
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should return DEFAULT when customColors is empty object', ({ expect }) => {
      const result = LikeC4Styles.from(undefined, {})
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should return DEFAULT when both are empty objects', ({ expect }) => {
      const result = LikeC4Styles.from({}, {})
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should create new instance when custom colors are provided', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        customBlue: computeColorValues('#0000FF'),
      }
      const result = LikeC4Styles.from(undefined, customColors)
      expect(result).not.toBe(LikeC4Styles.DEFAULT)
      expect(result).toBeInstanceOf(LikeC4Styles)
      expect(result.isThemeColor('customBlue')).toBe(true)
    })

    it('should create new instance when defaults are provided', ({ expect }) => {
      const stylesConfig: LikeC4ProjectStylesConfig = {
        defaults: {
          color: 'blue',
        },
      }
      const result = LikeC4Styles.from(stylesConfig)
      expect(result).not.toBe(LikeC4Styles.DEFAULT)
      expect(result.defaults.color).toBe('blue')
    })

    it('should create new instance when customCss is provided', ({ expect }) => {
      const stylesConfig: LikeC4ProjectStylesConfig = {
        customCss: {
          content: '.custom { color: red; }',
        },
      }
      const result = LikeC4Styles.from(stylesConfig)
      expect(result).not.toBe(LikeC4Styles.DEFAULT)
    })

    it('should merge custom colors from both parameters', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        customColor1: computeColorValues('#111111'),
        customColor2: computeColorValues('#222222'),
      }
      const result = LikeC4Styles.from(undefined, customColors)
      expect(result).not.toBe(LikeC4Styles.DEFAULT)
      expect(result.isThemeColor('customColor1')).toBe(true)
      expect(result.isThemeColor('customColor2')).toBe(true)
    })

    it('should return DEFAULT when merged config equals default style', ({ expect }) => {
      const stylesConfig: LikeC4ProjectStylesConfig = {
        theme: {
          colors: {},
        },
        defaults: {
          shape: 'rectangle',
        },
      }
      const result = LikeC4Styles.from(stylesConfig)
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should return DEFAULT when merged config equals default style', ({ expect }) => {
      const stylesConfig: LikeC4ProjectStylesConfig = {
        theme: {
          colors: {},
        },
        defaults: {},
      }
      const result = LikeC4Styles.from(stylesConfig)
      expect(result).toBe(LikeC4Styles.DEFAULT)
    })

    it('should not return DEFAULT when customCss has content even if config matches default', ({ expect }) => {
      const stylesConfig: LikeC4ProjectStylesConfig = {
        customCss: {
          content: '.test {}',
        },
      }
      const result = LikeC4Styles.from(stylesConfig)
      expect(result).not.toBe(LikeC4Styles.DEFAULT)
    })
  })

  describe('equals', () => {
    it('should return true when comparing same instance', ({ expect }) => {
      const styles = LikeC4Styles.DEFAULT
      expect(styles.equals(styles)).toBe(true)
    })

    it('should return true for two DEFAULT instances', ({ expect }) => {
      const styles1 = LikeC4Styles.DEFAULT
      const styles2 = LikeC4Styles.DEFAULT
      expect(styles1.equals(styles2)).toBe(true)
    })

    it('should return true for instances with identical custom colors', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        customRed: computeColorValues('#FF0000'),
      }
      const styles1 = LikeC4Styles.from(undefined, customColors)
      const styles2 = LikeC4Styles.from(undefined, customColors)
      expect(styles2).not.toBe(styles1)
      expect(styles1.equals(styles2)).toBe(true)
    })

    it('should return false for instances with different custom colors', ({ expect }) => {
      const customColors1: CustomColorDefinitions = {
        customRed: computeColorValues('#FF0000'),
      }
      const customColors2: CustomColorDefinitions = {
        customGreen: computeColorValues('#00FF00'),
      }
      const styles1 = LikeC4Styles.from(undefined, customColors1)
      const styles2 = LikeC4Styles.from(undefined, customColors2)
      expect(styles1.equals(styles2)).toBe(false)
    })

    it('should return false for instances with different defaults', ({ expect }) => {
      const config1: LikeC4ProjectStylesConfig = {
        defaults: {
          color: 'blue',
        },
      }
      const config2: LikeC4ProjectStylesConfig = {
        defaults: {
          color: 'red',
        },
      }
      const styles1 = LikeC4Styles.from(config1, undefined)
      const styles2 = LikeC4Styles.from(config2, undefined)
      expect(styles1.equals(styles2)).toBe(false)
    })

    it('should return false when one has customCss and other does not', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        custom: computeColorValues('#FF0000'),
      }
      const config1: LikeC4ProjectStylesConfig = {
        customCss: {
          content: '.test {}',
        },
      }
      const styles1 = LikeC4Styles.from(config1, customColors)
      const styles2 = LikeC4Styles.from({}, customColors)
      expect(styles1.equals(styles2)).toBe(false)
    })

    it('should return true when both have identical customCss', ({ expect }) => {
      const customCss = {
        content: '.test { color: red; }',
      }
      const customColors: CustomColorDefinitions = {
        custom: computeColorValues('#FF0000'),
      }
      const config1: LikeC4ProjectStylesConfig = {
        customCss,
      }
      const config2: LikeC4ProjectStylesConfig = {
        customCss,
      }
      const styles1 = LikeC4Styles.from(config1, customColors)
      const styles2 = LikeC4Styles.from(config2, customColors)
      expect(styles1.equals(styles2)).toBe(true)
    })

    it('should return false when customCss content differs', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        custom: computeColorValues('#FF0000'),
      }
      const config1: LikeC4ProjectStylesConfig = {
        customCss: {
          content: '.test1 {}',
        },
      }
      const config2: LikeC4ProjectStylesConfig = {
        customCss: {
          content: '.test2 {}',
        },
      }
      const styles1 = LikeC4Styles.from(config1, customColors)
      const styles2 = LikeC4Styles.from(config2, customColors)
      expect(styles1.equals(styles2)).toBe(false)
    })

    it('should return false when comparing DEFAULT with custom instance', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        custom: computeColorValues('#FF0000'),
      }
      const styles1 = LikeC4Styles.DEFAULT
      const styles2 = LikeC4Styles.from(undefined, customColors)
      expect(styles1.equals(styles2)).toBe(false)
    })

    it('should handle missing customCss as equal', ({ expect }) => {
      const customColors: CustomColorDefinitions = {
        custom: computeColorValues('#FF0000'),
      }
      const config1: LikeC4ProjectStylesConfig = {}
      const config2: LikeC4ProjectStylesConfig = {}
      const styles1 = LikeC4Styles.from(config1, customColors)
      const styles2 = LikeC4Styles.from(config2, customColors)
      expect(styles1.equals(styles2)).toBe(true)
    })
  })
})
