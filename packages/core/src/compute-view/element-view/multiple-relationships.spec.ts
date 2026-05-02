import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'

const baseBuilder = Builder
  .specification({
    elements: { el: {} },
  })
  .model(({ el }, m) =>
    m(
      el('a'),
      el('b'),
    )
  )

describe('multiple-relationships integration', () => {
  describe('spec-level expansion', () => {
    it('expands edges when kind has multiple: true in spec', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: { multiple: true },
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
        )
      ))

      const view = t.computeView(
        t.$include('*'),
      )

      expect(view.edges).toHaveLength(2)
      expect(view.edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
      for (const edge of view.edges) {
        expect(edge.relations).toHaveLength(1)
      }
    })

    it('does not expand edges without spec-level multiple: true', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: {},
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
        )
      ))

      const view = t.computeView(
        t.$include('*'),
      )

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(2)
      expect(view.edges[0]!.label).toBe('[...]')
    })

    it('only expands edges of the matching kind, not other kinds', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: { multiple: true },
            sync: {},
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
          rel('a', 'b', { title: 'gamma', kind: 'sync' }),
        )
      ))

      const view = t.computeView(
        t.$include('*'),
      )

      expect(view.edges).toHaveLength(3)
      // 2 expanded async edges + 1 merged sync edge (with 2 sync? no just 1 sync)
      // only 1 sync relation, so 1 edge for it
      // Wait - there's 1 sync relation, so no merging needed
      // But the connection has 3 relations: 2 async + 1 sync
      // async gets expanded (2 edges), sync is a single relation in the merged group
      // Actually: relations = [alpha, beta, gamma]
      // partition by shouldExpand: expanded = [alpha, beta], merged = [gamma]
      // expanded produces 2 edges, merged produces 1 edge (with 1 relation each)
      // Total = 3 edges
      const expanded = view.edges.filter(e => e.label !== 'gamma')
      const merged = view.edges.filter(e => e.label === 'gamma')
      expect(expanded).toHaveLength(2)
      expect(merged).toHaveLength(1)
    })
  })

  describe('view-rule expansion', () => {
    it('expands edges with include relation with { multiple: true }', () => {
      const t = TestHelper.from(baseBuilder.model(({ rel }, m) =>
        m(
          rel('a', 'b', 'alpha'),
          rel('a', 'b', 'beta'),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { with: { multiple: true } }),
      )

      expect(view.edges).toHaveLength(2)
      expect(view.edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
      for (const edge of view.edges) {
        expect(edge.relations).toHaveLength(1)
      }
    })

    it('does not expand edges without multiple flag in include', () => {
      const t = TestHelper.from(baseBuilder.model(({ rel }, m) =>
        m(
          rel('a', 'b', 'alpha'),
          rel('a', 'b', 'beta'),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b'),
      )

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(2)
    })

    it('expands only matching edges with specific include', () => {
      const t = TestHelper.from(baseBuilder.model(({ rel }, m) =>
        m(
          rel('a', 'b', 'alpha'),
          rel('a', 'b', 'beta'),
          rel('a', 'b', 'gamma'),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { with: { multiple: true } }),
      )

      expect(view.edges).toHaveLength(3)
      for (const edge of view.edges) {
        expect(edge.relations).toHaveLength(1)
      }
    })
  })

  describe('where predicate combined with multiple', () => {
    it('where kind filter + spec-level multiple expands included relations', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: { multiple: true },
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
          rel('a', 'b', { title: 'gamma' }),
          rel('a', 'b', { title: 'delta' }),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { where: 'kind is async' } as any),
      )

      expect(view.edges).toHaveLength(2)
      expect(view.edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
      for (const edge of view.edges) {
        expect(edge.relations).toHaveLength(1)
      }
    })

    it('where kind filter without spec-level multiple does not expand', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: {},
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { where: 'kind is async' } as any),
      )

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(2)
    })

    it('where filter + with { multiple: true } expands matching relations and excludes others', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: {},
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
          rel('a', 'b', { title: 'gamma' }),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { where: 'kind is async', with: { multiple: true } } as any),
      )

      expect(view.edges).toHaveLength(2)
      expect(view.edges.map(e => e.label).sort()).toEqual(['alpha', 'beta'])
      for (const edge of view.edges) {
        expect(edge.relations).toHaveLength(1)
      }
    })
  })

  describe('multiple false override', () => {
    it('include with multiple: false overrides spec-level multiple: true', () => {
      const builder = Builder
        .specification({
          elements: { el: {} },
          relationships: {
            async: { multiple: true },
          },
        })
        .model(({ el }, m) =>
          m(
            el('a'),
            el('b'),
          )
        )

      const t = TestHelper.from(builder.model(({ rel }, m) =>
        m(
          rel('a', 'b', { title: 'alpha', kind: 'async' }),
          rel('a', 'b', { title: 'beta', kind: 'async' }),
        )
      ))

      const view = t.computeView(
        t.$include('a -> b', { with: { multiple: false } }),
      )

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(2)
      expect(view.edges[0]!.label).toBe('[...]')
    })

    it('include with multiple: false overrides include with multiple: true', () => {
      const t = TestHelper.from(baseBuilder.model(({ rel }, m) =>
        m(
          rel('a', 'b', 'alpha'),
          rel('a', 'b', 'beta'),
        )
      ))

      const view = t.computeView(
        TestHelper.$rules(
          t.$include('a -> b', { with: { multiple: true } }),
          t.$include('a -> b', { with: { multiple: false } }),
        ),
      )

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]!.relations).toHaveLength(2)
    })
  })
})
