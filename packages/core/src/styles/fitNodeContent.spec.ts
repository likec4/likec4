import { describe, expect, it } from 'vitest'
import { countWrappedLines, fitNodeContent } from './fitNodeContent'
import { LikeC4Styles } from './LikeC4Styles'

const styles = LikeC4Styles.DEFAULT

describe('countWrappedLines', () => {
  it('wraps words greedily', () => {
    expect(countWrappedLines('one two three', 7)).toBe(2)
    expect(countWrappedLines('one two three', 20)).toBe(1)
  })

  it('splits long words', () => {
    expect(countWrappedLines('abcdefghij', 4)).toBe(3)
  })

  it('respects line breaks', () => {
    expect(countWrappedLines('a\nb', 10)).toBe(2)
  })
})

describe('fitNodeContent', () => {
  const base = {
    shape: 'rectangle',
    style: { size: 'md', sizing: 'fixed' },
  } as const

  it('keeps base values for short title', () => {
    const fitted = styles.fitNodeContent({ ...base, title: 'API' })
    expect(fitted.textSize).toBe(styles.fontSize('md'))
    expect(fitted.iconSize).toBe(styles.iconSize('md'))
  })

  it('returns base values when sizing is auto', () => {
    const fitted = styles.fitNodeContent({
      ...base,
      style: { size: 'md' },
      title: 'A very long title '.repeat(10),
      icon: 'aws:lambda',
    })
    expect(fitted.textSize).toBe(styles.fontSize('md'))
    expect(fitted.iconSize).toBe(styles.iconSize('md'))
  })

  it('shrinks long title', () => {
    const fitted = styles.fitNodeContent({
      ...base,
      title: 'A very long title that does not fit into the node box with default font size at all',
    })
    expect(fitted.textSize).toBeLessThan(styles.fontSize('md'))
    expect(fitted.textSize).toBeGreaterThanOrEqual(styles.fontSize('md') * 0.5)
  })

  it('does not go below minimum font size', () => {
    const fitted = styles.fitNodeContent({
      ...base,
      style: { size: 'xs', sizing: 'fixed' },
      title: 'Lorem ipsum '.repeat(50),
    })
    expect(fitted.textSize).toBe(9)
  })

  it('shrinks more with icon on the side than without icon', () => {
    const title = 'Customer Relationship Management Platform Service'
    const withoutIcon = styles.fitNodeContent({ ...base, title })
    const withIcon = styles.fitNodeContent({ ...base, title, icon: 'aws:lambda' })
    expect(withIcon.textSize).toBeLessThanOrEqual(withoutIcon.textSize)
    expect(withIcon.maxchars).toBeLessThan(withoutIcon.maxchars)
  })

  it('caps icon size to the node box', () => {
    const fitted = fitNodeContent({
      title: 'API',
      shape: 'rectangle',
      size: 'xs',
      width: 180,
      height: 100,
      padding: 8,
      textSize: 13.33,
      iconSize: 90,
      hasIcon: true,
      iconPosition: 'top',
      hasTechnology: false,
      hasDescription: false,
    })
    expect(fitted.iconSize).toBeLessThanOrEqual((100 - 16) * 0.35)
  })

  it('uses provided box size', () => {
    const title = 'Customer Relationship Management Platform'
    const small = styles.fitNodeContent({ ...base, title, width: 200, height: 100 })
    const large = styles.fitNodeContent({ ...base, title, width: 600, height: 300 })
    expect(small.textSize).toBeLessThan(large.textSize)
  })
})
