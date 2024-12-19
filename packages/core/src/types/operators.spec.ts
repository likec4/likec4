import { type Filterable, whereOperatorAsPredicate } from '@likec4/core'
import { fail } from 'assert'
import { describe, expect, it } from 'vitest'

type FTag = 'old' | 'new'
type FKind = 'a' | 'b'

function item(props: Filterable<FTag, FKind>): Filterable<FTag, FKind> {
  return props
}

describe('operators', () => {
  it('tag eq', () => {
    const matchingItem1 = item({ tags: ['old'] })
    const matchingItem2 = item({ tags: ['old', 'new'] })
    const nonMatchingItem1 = item({ tags: ['new'] })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate({ tag: { eq: <FTag> 'old' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('tag neq', () => {
    const matchingItem1 = item({ tags: ['old'] })
    const matchingItem2 = item({})
    const nonMatchingItem1 = item({ tags: ['new'] })
    const nonMatchingItem2 = item({ tags: ['old', 'new'] })

    const predicate = whereOperatorAsPredicate({ tag: { neq: <FTag> 'new' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('kind eq', () => {
    const matchingItem = item({ kind: 'a' })
    const nonMatchingItem1 = item({ kind: 'b' })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate({ kind: { eq: <FKind> 'a' } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('kind neq', () => {
    const matchingItem1 = item({ kind: 'a' })
    const matchingItem2 = item({})
    const nonMatchingItem = item({ kind: 'b' })

    const predicate = whereOperatorAsPredicate({ kind: { neq: <FKind> 'b' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('not', () => {
    const matchingItem1 = item({ kind: 'a' })
    const nonMatchingItem = item({ kind: 'b' })

    const predicate = whereOperatorAsPredicate({ not: { kind: { eq: <FKind> 'b' } } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('and', () => {
    const matchingItem = item({ kind: 'a', tags: ['old'] })
    const nonMatchingItem1 = item({ kind: 'a', tags: ['new'] })
    const nonMatchingItem2 = item({ kind: 'b', tags: ['new'] })

    const predicate = whereOperatorAsPredicate({
      and: [
        { kind: { eq: <FKind> 'a' } },
        { tag: { eq: <FTag> 'old' } }
      ]
    })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('or', () => {
    const matchingItem1 = item({ kind: 'a', tags: ['old'] })
    const matchingItem2 = item({ kind: 'a', tags: ['new'] })
    const matchingItem3 = item({ kind: 'b', tags: ['old'] })
    const nonMatchingItem = item({ kind: 'b', tags: ['new'] })

    const predicate = whereOperatorAsPredicate({
      or: [
        { kind: { eq: <FKind> 'a' } },
        { tag: { eq: <FTag> 'old' } }
      ]
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('participant source', () => {
    const matchingItem1 = item({ source: { kind: 'a', tags: ['old'] }, target: {} })
    const matchingItem2 = item({ source: { kind: 'a', tags: ['new'] }, target: {} })
    const matchingItem3 = item({ source: { kind: 'b', tags: ['old'] }, target: {} })
    const nonMatchingItem1 = item({ source: {}, target: { kind: 'a', tags: ['old'] } })
    const nonMatchingItem2 = item({ source: { kind: 'b', tags: ['new'] }, target: {} })

    const predicate = whereOperatorAsPredicate({
      or: [
        { participant: 'source', operator: { kind: { eq: <FKind> 'a' } } },
        { participant: 'source', operator: { tag: { eq: <FTag> 'old' } } }
      ]
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('participant target', () => {
    const matchingItem1 = item({ source: {}, target: { kind: 'a', tags: ['old'] } })
    const matchingItem2 = item({ source: {}, target: { kind: 'a', tags: ['new'] } })
    const matchingItem3 = item({ source: {}, target: { kind: 'b', tags: ['old'] } })
    const nonMatchingItem1 = item({ source: { kind: 'a', tags: ['old'] }, target: {} })
    const nonMatchingItem2 = item({ source: {}, target: { kind: 'b', tags: ['new'] } })

    const predicate = whereOperatorAsPredicate({
      or: [
        { participant: 'target', operator: { kind: { eq: <FKind> 'a' } } },
        { participant: 'target', operator: { tag: { eq: <FTag> 'old' } } }
      ]
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })
})
