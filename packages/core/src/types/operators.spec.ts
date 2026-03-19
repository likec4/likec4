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

  it('metadata eq', ({ expect }) => {
    const matchingItem = item({ metadata: { environment: 'production' } })
    const nonMatchingItem1 = item({ metadata: { environment: 'staging' } })
    const nonMatchingItem2 = item({})
    const nonMatchingItem3 = item({ metadata: {} })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment', value: { eq: 'production' } } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
    expect(predicate(nonMatchingItem3)).toBe(false)
  })

  it('metadata eq string', ({ expect }) => {
    const matchingItem = item({ metadata: { environment: 'production' } })
    const nonMatchingItem = item({ metadata: { environment: 'staging' } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment', value: 'production' } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata neq', ({ expect }) => {
    const matchingItem1 = item({ metadata: { environment: 'production' } })
    const matchingItem2 = item({})
    const matchingItem3 = item({ metadata: {} })
    const nonMatchingItem = item({ metadata: { environment: 'staging' } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment', value: { neq: 'staging' } } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(matchingItem3)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata existence check', ({ expect }) => {
    const matchingItem = item({ metadata: { environment: 'production' } })
    const nonMatchingItem1 = item({})
    const nonMatchingItem2 = item({ metadata: {} })
    const nonMatchingItem3 = item({ metadata: { environment: undefined } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment' } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
    expect(predicate(nonMatchingItem3)).toBe(false)
  })

  it('not metadata existence check', ({ expect }) => {
    const matchingItem1 = item({})
    const matchingItem2 = item({ metadata: {} })
    const nonMatchingItem = item({ metadata: { environment: 'production' } })

    const predicate = whereOperatorAsPredicate<A>({ not: { metadata: { key: 'environment' } } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata with array values', ({ expect }) => {
    const matchingItem = item({ metadata: { tags: ['v1', 'v2'] } })
    const nonMatchingItem = item({ metadata: { tags: ['v3', 'v4'] } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'tags', value: { eq: 'v2' } } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata neq with array values', ({ expect }) => {
    const matchingItem = item({ metadata: { tags: ['v1', 'v3'] } })
    const nonMatchingItem = item({ metadata: { tags: ['v1', 'v2'] } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'tags', value: { neq: 'v2' } } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata with and', ({ expect }) => {
    const matchingItem = item({ kind: 'a', metadata: { environment: 'production' } })
    const nonMatchingItem1 = item({ kind: 'b', metadata: { environment: 'production' } })
    const nonMatchingItem2 = item({ kind: 'a', metadata: { environment: 'staging' } })

    const predicate = whereOperatorAsPredicate<A>({
      and: [
        { kind: 'a' },
        { metadata: { key: 'environment', value: 'production' } },
      ],
    })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('metadata with or', ({ expect }) => {
    const matchingItem1 = item({ metadata: { environment: 'production' } })
    const matchingItem2 = item({ metadata: { environment: 'staging' } })
    const nonMatchingItem1 = item({ metadata: { environment: 'development' } })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({
      or: [
        { metadata: { key: 'environment', value: 'production' } },
        { metadata: { key: 'environment', value: 'staging' } },
      ],
    })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('metadata eq operator syntax', ({ expect }) => {
    const matchingItem = item({ metadata: { environment: 'production' } })
    const nonMatchingItem = item({ metadata: { environment: 'staging' } })

    // { eq: ... } explicit form (corresponds to == syntax)
    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment', value: { eq: 'production' } } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('metadata neq operator syntax', ({ expect }) => {
    const matchingItem = item({ metadata: { environment: 'production' } })
    const nonMatchingItem = item({ metadata: { environment: 'staging' } })

    // { neq: ... } explicit form (corresponds to != syntax)
    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'environment', value: { neq: 'staging' } } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })

  it('participant source metadata', ({ expect }) => {
    const matchingItem = item({
      source: { metadata: { environment: 'production' } },
      target: {},
    })
    const nonMatchingItem1 = item({
      source: {},
      target: { metadata: { environment: 'production' } },
    })
    const nonMatchingItem2 = item({
      source: { metadata: { environment: 'staging' } },
      target: {},
    })

    const predicate = whereOperatorAsPredicate<A>({
      participant: 'source',
      operator: { metadata: { key: 'environment', value: 'production' } },
    })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('participant target metadata', ({ expect }) => {
    const matchingItem = item({
      source: {},
      target: { metadata: { environment: 'staging' } },
    })
    const nonMatchingItem1 = item({
      source: { metadata: { environment: 'staging' } },
      target: {},
    })
    const nonMatchingItem2 = item({
      source: {},
      target: { metadata: { environment: 'production' } },
    })

    const predicate = whereOperatorAsPredicate<A>({
      participant: 'target',
      operator: { metadata: { key: 'environment', value: 'staging' } },
    })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('metadata boolean string values', ({ expect }) => {
    const matchingItem = item({ metadata: { critical: 'true' } })
    const nonMatchingItem1 = item({ metadata: { critical: 'false' } })
    const nonMatchingItem2 = item({})

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'critical', value: 'true' } })

    expect(predicate(matchingItem)).toBe(true)
    expect(predicate(nonMatchingItem1)).toBe(false)
    expect(predicate(nonMatchingItem2)).toBe(false)
  })

  it('metadata boolean string neq', ({ expect }) => {
    const matchingItem1 = item({ metadata: { critical: 'true' } })
    const matchingItem2 = item({})
    const nonMatchingItem = item({ metadata: { critical: 'false' } })

    const predicate = whereOperatorAsPredicate<A>({ metadata: { key: 'critical', value: { neq: 'false' } } })

    expect(predicate(matchingItem1)).toBe(true)
    expect(predicate(matchingItem2)).toBe(true)
    expect(predicate(nonMatchingItem)).toBe(false)
  })
})
