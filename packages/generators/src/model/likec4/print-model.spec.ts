import type { Element, Relationship } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { materialize } from './base'
import { printModel } from './print-model'

function render(
  elements: Record<string, Element>,
  relations: Record<string, Relationship>,
): string {
  return materialize(printModel(elements, relations))
}

function makeElement(overrides: Partial<Element> & { id: string; kind: string }): Element {
  return {
    title: '',
    description: undefined,
    summary: undefined,
    technology: undefined,
    notation: undefined,
    tags: [],
    links: [],
    metadata: {},
    style: {},
    ...overrides,
  } as Element
}

function makeRelation(overrides: Partial<Relationship> & { id: string }): Relationship {
  return {
    source: { model: 'a' },
    target: { model: 'b' },
    title: '',
    description: undefined,
    summary: undefined,
    technology: undefined,
    tags: [],
    links: [],
    metadata: {},
    ...overrides,
  } as Relationship
}

describe('printModel', () => {
  it('prints model block wrapper', () => {
    const output = render({}, {})
    expect(output).toContain('model {')
    expect(output).toContain('}')
  })

  it('prints a simple element', () => {
    const output = render(
      { cloud: makeElement({ id: 'cloud', kind: 'system' }) },
      {},
    )
    expect(output).toContain('cloud = system')
  })

  it('prints element with title', () => {
    const output = render(
      { cloud: makeElement({ id: 'cloud', kind: 'system', title: 'Cloud System' }) },
      {},
    )
    expect(output).toContain('cloud = system \'Cloud System\'')
  })

  it('prints element with description', () => {
    const output = render(
      { cloud: makeElement({ id: 'cloud', kind: 'system', description: { txt: 'A cloud system' } }) },
      {},
    )
    expect(output).toContain('description')
    expect(output).toContain('A cloud system')
  })

  it('prints nested elements as hierarchy', () => {
    const output = render(
      {
        'cloud': makeElement({ id: 'cloud', kind: 'system' }),
        'cloud.backend': makeElement({ id: 'cloud.backend', kind: 'component' }),
      },
      {},
    )
    expect(output).toContain('cloud = system')
    expect(output).toContain('backend = component')
  })

  it('prints element with tags', () => {
    const output = render(
      {
        svc: makeElement({
          id: 'svc',
          kind: 'component',
          tags: ['internal', 'v2'] as any,
        }),
      },
      {},
    )
    expect(output).toContain('#internal, #v2')
  })

  it('prints element with metadata', () => {
    const output = render(
      {
        svc: makeElement({
          id: 'svc',
          kind: 'component',
          metadata: { key1: 'value1' },
        }),
      },
      {},
    )
    expect(output).toContain('metadata {')
    expect(output).toContain('key1 \'value1\'')
  })

  it('prints element with array metadata', () => {
    const output = render(
      {
        svc: makeElement({
          id: 'svc',
          kind: 'component',
          metadata: { tags: ['a', 'b', 'c'] } as any,
        }),
      },
      {},
    )
    expect(output).toContain('metadata {')
    expect(output).toContain('tags [\'a\', \'b\', \'c\']')
  })

  it('prints element with style', () => {
    const output = render(
      {
        svc: makeElement({
          id: 'svc',
          kind: 'component',
          style: { shape: 'storage' },
        } as any),
      },
      {},
    )
    expect(output).toContain('style {')
    expect(output).toContain('shape storage')
  })

  it('prints simple relation', () => {
    const output = render(
      {},
      { r1: makeRelation({ id: 'r1', source: { model: 'a' } as any, target: { model: 'b' } as any }) },
    )
    expect(output).toContain('a -> b')
  })

  it('prints relation with title', () => {
    const output = render(
      {},
      {
        r1: makeRelation({
          id: 'r1',
          source: { model: 'a' } as any,
          target: { model: 'b' } as any,
          title: 'calls',
        }),
      },
    )
    expect(output).toContain('a -> b \'calls\'')
  })

  it('prints relation with kind', () => {
    const output = render(
      {},
      {
        r1: makeRelation({
          id: 'r1',
          source: { model: 'a' } as any,
          target: { model: 'b' } as any,
          kind: 'async' as any,
        }),
      },
    )
    expect(output).toContain('a -[async]-> b')
  })

  it('prints relation with body properties', () => {
    const output = render(
      {},
      {
        r1: makeRelation({
          id: 'r1',
          source: { model: 'a' } as any,
          target: { model: 'b' } as any,
          color: 'red' as any,
          line: 'dotted' as any,
          technology: 'REST',
        }),
      },
    )
    expect(output).toContain('a -> b {')
    expect(output).toContain('color red')
    expect(output).toContain('line dotted')
    expect(output).toContain('technology \'REST\'')
  })

  it('prints relation with links', () => {
    const output = render(
      {},
      {
        r1: makeRelation({
          id: 'r1',
          source: { model: 'a' } as any,
          target: { model: 'b' } as any,
          links: [{ url: 'https://api.example.com' }] as any,
        }),
      },
    )
    expect(output).toContain('link https://api.example.com')
  })
})
