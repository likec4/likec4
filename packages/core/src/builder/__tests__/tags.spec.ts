import { describe, expect, it, test } from 'vitest'
import { Builder } from '../Builder'

describe('Builder tag colors assignment', () => {
  test('Builder assigns tag colors', () => {
    const m = Builder
      .specification({
        elements: {},
        deployments: {},
        tags: {
          tag1: {
            color: '#FFF',
          },
          tag2: {},
          tag3: {},
        },
      })
      .toLikeC4Model()

    expect(m.specification.tags).toEqual({
      tag1: {
        color: '#FFF',
      },
      tag2: {
        color: 'tomato',
      },
      tag3: {
        color: 'grass',
      },
    })
  })

  it('should preserve predefined colors', () => {
    const m = Builder
      .specification({
        elements: {},
        deployments: {},
        tags: {
          tag1: { color: '#ff0000' },
          tag2: {},
          tag3: { color: '#00ff00' },
          tag4: {},
        },
      })
      .toLikeC4Model()

    expect(m.specification.tags).toEqual({
      tag1: {
        color: '#ff0000',
      },
      tag2: {
        color: 'tomato',
      },
      tag3: {
        color: '#00ff00',
      },
      tag4: {
        color: 'grass',
      },
    })
  })
})
