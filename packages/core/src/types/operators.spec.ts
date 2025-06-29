import { describe, it } from 'vitest'
import type { Aux, SpecAux } from './_aux'
import { type Filterable, whereOperatorAsPredicate } from './operators'

type A = Aux<
  'computed',
  string,
  string,
  string,
  string,
  SpecAux<
    'a' | 'b',
    'deployment1' | 'deployment2',
    string,
    'old' | 'new',
    string
  >
>

function item(props: Filterable<A>): Filterable<A> {
  return props
}

describe('expression operators', () => {
  it('tag eq', ({ expect }) => {
    const matchingItem1 = item({ tags: ['old'] })
    const matchingItem2 = item({ tags: ['old', 'new'] })
    const nonMatchingItem1 = item({ tags: ['new'] })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({ tag: { eq: 'old' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('tag eq string', ({ expect }) => {
    const matchingItem1 = item({ tags: ['old'] })
    const matchingItem2 = item({ tags: ['old', 'new'] })
    const nonMatchingItem1 = item({ tags: ['new'] })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({ tag: 'old' })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('tag neq', ({ expect }) => {
    const matchingItem1 = item({ tags: ['old'] })
    const matchingItem2 = item({})
    const nonMatchingItem1 = item({ tags: ['new'] })
    const nonMatchingItem2 = item({ tags: ['old', 'new'] })

    const predicate = whereOperatorAsPredicate<A>({ tag: { neq: 'new' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('kind eq', ({ expect }) => {
    const matchingItem = item({ kind: 'a' })
    const nonMatchingItem1 = item({ kind: 'b' })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({ kind: { eq: 'a' } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('kind eq string', ({ expect }) => {
    const matchingItem = item({ kind: 'a' })
    const nonMatchingItem1 = item({ kind: 'b' })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({ kind: 'a' })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('kind neq', ({ expect }) => {
    const matchingItem1 = item({ kind: 'a' })
    const matchingItem2 = item({})
    const nonMatchingItem = item({ kind: 'b' })

    const predicate = whereOperatorAsPredicate<A>({ kind: { neq: 'b' } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('not', ({ expect }) => {
    const matchingItem1 = item({ kind: 'a' })
    const nonMatchingItem = item({ kind: 'b' })

    const predicate = whereOperatorAsPredicate<A>({ not: { kind: { eq: 'b' } } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('and', ({ expect }) => {
    const matchingItem = item({ kind: 'a', tags: ['old'] })
    const nonMatchingItem1 = item({ kind: 'a', tags: ['new'] })
    const nonMatchingItem2 = item({ kind: 'b', tags: ['new'] })

    const predicate = whereOperatorAsPredicate<A>({
      and: [
        { kind: 'a' },
        { tag: { eq: 'old' } },
      ],
    })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('or', ({ expect }) => {
    const matchingItem1 = item({ kind: 'a', tags: ['old'] })
    const matchingItem2 = item({ kind: 'a', tags: ['new'] })
    const matchingItem3 = item({ kind: 'b', tags: ['old'] })
    const nonMatchingItem = item({ kind: 'b', tags: ['new'] })

    const predicate = whereOperatorAsPredicate<A>({
      or: [
        { kind: { eq: 'a' } },
        { tag: { eq: 'old' } },
      ],
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('participant source', ({ expect }) => {
    const matchingItem1 = item({ source: { kind: 'a', tags: ['old'] }, target: {} })
    const matchingItem2 = item({ source: { kind: 'a', tags: ['new'] }, target: {} })
    const matchingItem3 = item({ source: { kind: 'b', tags: ['old'] }, target: {} })
    const nonMatchingItem1 = item({ source: {}, target: { kind: 'a', tags: ['old'] } })
    const nonMatchingItem2 = item({ source: { kind: 'b', tags: ['new'] }, target: {} })

    const predicate = whereOperatorAsPredicate<A>({
      or: [
        { participant: 'source', operator: { kind: { eq: 'a' } } },
        { participant: 'source', operator: { tag: { eq: 'old' } } },
      ],
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('participant target', ({ expect }) => {
    const matchingItem1 = item({ source: {}, target: { kind: 'a', tags: ['old'] } })
    const matchingItem2 = item({ source: {}, target: { kind: 'a', tags: ['new'] } })
    const matchingItem3 = item({ source: {}, target: { kind: 'b', tags: ['old'] } })
    const nonMatchingItem1 = item({ source: { kind: 'a', tags: ['old'] }, target: {} })
    const nonMatchingItem2 = item({ source: {}, target: { kind: 'b', tags: ['new'] } })

    const predicate = whereOperatorAsPredicate<A>({
      or: [
        { participant: 'target', operator: { kind: { eq: 'a' } } },
        { participant: 'target', operator: { tag: { eq: 'old' } } },
      ],
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })
})
