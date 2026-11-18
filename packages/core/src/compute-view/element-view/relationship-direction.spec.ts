import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'

const spec = Builder
  .specification({
    elements: { el: {} },
    relationships: {
      subscribes: { direction: 'back' },
    },
  })

describe('relationship direction', () => {
  it('edge has no dir by default', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('a'),
        el('b'),
        rel('a', 'b'),
      )
    ))
    const view = t.computeView(t.$include('*'))
    expect(view.edges).toHaveLength(1)
    expect(view.edges[0]).not.toHaveProperty('dir')
  })

  it('keeps semantic source and target, sets dir back', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('consumer'),
        el('producer'),
        rel('consumer', 'producer', { direction: 'back' }),
      )
    ))
    const view = t.computeView(t.$include('*'))
    expect(view.edges).toHaveLength(1)
    expect(view.edges[0]).toMatchObject({
      id: 'consumer -> producer',
      source: 'consumer',
      target: 'producer',
      dir: 'back',
    })
  })

  it('direction forward does not set dir', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('a'),
        el('b'),
        rel('a', 'b', { direction: 'forward' }),
      )
    ))
    const view = t.computeView(t.$include('*'))
    expect(view.edges[0]).not.toHaveProperty('dir')
  })

  it('include predicate still matches semantic direction', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('consumer'),
        el('producer'),
        rel('consumer', 'producer', { direction: 'back' }),
      )
    ))
    const view = t.computeView(
      t.$include('consumer'),
      t.$include('producer'),
      t.$include('consumer -> producer'),
    )
    expect(view.edges.map(e => e.id)).toEqual(['consumer -> producer'])

    const reversed = t.computeView(
      t.$include('consumer'),
      t.$include('producer'),
      t.$exclude('consumer -> producer'),
    )
    expect(reversed.edges).toHaveLength(0)
  })

  describe('merged relationships', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('sys'),
        el('sys.a'),
        el('sys.b'),
        el('ext'),
        el('ext.c'),
        rel('sys.a', 'ext.c', { direction: 'back' }),
        rel('sys.b', 'ext.c', { direction: 'back' }),
        rel('sys.b', 'ext', { title: 'forward' }),
      )
    ))

    it('back if all merged relationships are back', () => {
      const view = t.computeView(
        t.$include('sys'),
        t.$include('ext.c'),
      )
      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        id: 'sys -> ext.c',
        dir: 'back',
      })
      expect(view.edges[0]!.relations).toHaveLength(2)
    })

    it('not back if some merged relationship is forward', () => {
      const view = t.computeView(
        t.$include('sys'),
        t.$include('ext'),
      )
      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(3)
      expect(view.edges[0]).not.toHaveProperty('dir')
    })
  })

  describe('relationship kind', () => {
    // Builder does not merge specification into relationships (language server does),
    // so we emulate it by setting kind and direction
    it('kind and direction', () => {
      const t = TestHelper.from(spec.model(({ el, rel }, m) =>
        m(
          el('a'),
          el('b'),
          rel('b', 'a', { kind: 'subscribes', direction: 'back' }),
        )
      ))
      const view = t.computeView(t.$include('*'))
      expect(view.edges[0]).toMatchObject({
        source: 'b',
        target: 'a',
        kind: 'subscribes',
        dir: 'back',
      })
    })
  })

  describe('view-level override', () => {
    const t = TestHelper.from(spec.model(({ el, rel }, m) =>
      m(
        el('a'),
        el('b'),
        el('c'),
        rel('a', 'b', { direction: 'back' }),
        rel('a', 'c'),
      )
    ))

    it('forward overrides relationship back', () => {
      const view = t.computeView(
        t.$include('*'),
        t.$include('a -> b', { with: { direction: 'forward' } }),
      )
      const edge = view.edges.find(e => e.id === 'a -> b')
      expect(edge).toBeDefined()
      expect(edge).not.toHaveProperty('dir')
      expect(edge!.isCustomized).toBe(true)
    })

    it('back overrides relationship forward', () => {
      const view = t.computeView(
        t.$include('*'),
        t.$include('a -> c', { with: { direction: 'back' } }),
      )
      expect(view.edges.find(e => e.id === 'a -> c')).toMatchObject({
        source: 'a',
        target: 'c',
        dir: 'back',
      })
      // not affected
      expect(view.edges.find(e => e.id === 'a -> b')).toMatchObject({
        dir: 'back',
      })
    })

    it('last rule wins', () => {
      const view = t.computeView(
        t.$include('*'),
        t.$include('a -> c', { with: { direction: 'back' } }),
        t.$include('a -> c', { with: { direction: 'forward' } }),
      )
      expect(view.edges.find(e => e.id === 'a -> c')).not.toHaveProperty('dir')
    })

    it('override without direction keeps relationship direction', () => {
      const view = t.computeView(
        t.$include('*'),
        t.$include('a -> b', { with: { color: 'red' } }),
      )
      expect(view.edges.find(e => e.id === 'a -> b')).toMatchObject({
        color: 'red',
        dir: 'back',
      })
    })
  })
})
