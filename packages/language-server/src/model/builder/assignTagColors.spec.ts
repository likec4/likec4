import type { ColorLiteral, Tag, TagSpecification } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { assignTagColors, radixColors } from './assignTagColors'

// Helper to create test tags with proper typing
const createTestTags = <const T extends Record<string, { color?: string }>>(
  tags: T,
): {
  [K in keyof T]: { astPath: string; color?: ColorLiteral }
} => {
  const result = {} as Record<string, { astPath: string; color?: ColorLiteral }>
  for (const [key, value] of Object.entries(tags)) {
    const tagSpec: { astPath: string; color?: ColorLiteral } = {
      astPath: `path:${key}`,
    }
    if (value.color) {
      tagSpec.color = value.color as ColorLiteral
    }
    result[key] = tagSpec
  }
  return result as {
    [K in keyof T]: { astPath: string; color?: ColorLiteral }
  }
}

// Helper to safely access tag color with type assertion
const getTagColor = (
  result: Record<Tag, TagSpecification>,
  tagName: string,
): string | undefined => {
  const entry = Object.entries(result).find(([key]) => key === tagName)
  return entry ? entry[1].color : undefined
}

describe('assignTagColors', () => {
  it('should return empty object for empty input', () => {
    const result = assignTagColors({})
    expect(result).toEqual({})
  })

  it('should assign colors from radixColors to tags without predefined colors', () => {
    const tags = createTestTags({
      tag1: {},
      tag2: {},
      tag3: {},
    })

    const result = assignTagColors(tags)
    expect(result).toEqual({
      tag1: {
        color: radixColors[0],
      },
      tag2: {
        color: radixColors[1],
      },
      tag3: {
        color: radixColors[2],
      },
    })
  })

  it('should cycle through radixColors when there are more tags than colors', () => {
    // Create more tags than we have colors
    const tagCount = radixColors.length * 2 + 1 // More than one full cycle

    // Create test tags with unique names
    const testTags: Record<string, { color?: ColorLiteral }> = {}
    for (let i = 0; i < tagCount; i++) {
      testTags[`tag${i}`] = {}
    }

    const testTagsWithAst = createTestTags(testTags)
    const result = assignTagColors(testTagsWithAst)

    // Verify colors are assigned in sequence and cycle back to start
    for (let i = 0; i < tagCount; i++) {
      const expectedColor = radixColors[i % radixColors.length]
      const tagColor = getTagColor(result, `tag${i}`)
      expect(tagColor).toBeDefined()
      expect(tagColor).toBe(expectedColor)
    }
  })

  it('should preserve predefined colors', () => {
    const tags = createTestTags({
      tag1: { color: '#ff0000' },
      tag2: {},
      tag3: { color: '#00ff00' },
    })

    const result = assignTagColors(tags)
    expect(result).toEqual({
      tag1: {
        color: '#ff0000',
      },
      tag2: {
        color: radixColors[0],
      },
      tag3: {
        color: '#00ff00',
      },
    })
  })

  it('should handle mixed case with and without predefined colors', () => {
    const tags = createTestTags({
      tag1: { color: '#ff0000' },
      tag2: {},
      tag3: { color: '#00ff00' },
      tag4: {},
    })

    const result = assignTagColors(tags)
    expect(result).toEqual({
      tag1: {
        color: '#ff0000',
      },
      tag2: {
        color: radixColors[0],
      },
      tag3: {
        color: '#00ff00',
      },
      tag4: {
        color: radixColors[1],
      },
    })
  })

  it('should sort tags alphabetically', () => {
    const tags = createTestTags({
      'zebra': {},
      'apple': {},
      'banana': {},
      'cherry': { color: '#ff0000' },
    })

    const result = assignTagColors(tags)
    expect(result).toEqual({
      apple: {
        color: radixColors[0],
      },
      banana: {
        color: radixColors[1],
      },
      cherry: {
        color: '#ff0000',
      },
      zebra: {
        color: radixColors[2],
      },
    })
  })
})
