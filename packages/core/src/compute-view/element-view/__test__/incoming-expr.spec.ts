import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'
import { $exclude, $include, computeView } from './fixture'
import { TestHelper } from './TestHelper'

describe('incoming-expr', () => {
  it('includes a bidirectional relationship from either endpoint', () => {
    const { $include } = TestHelper
    const builder = Builder
      .specification({
        elements: {
          component: {},
        },
      })
      .model(({ component, rel }, _) =>
        _(
          component('a'),
          component('b'),
          rel('a', 'b', { tail: 'normal' }),
        )
      )
    const test = TestHelper.from(builder)

    expect(test.computeView($include('-> b')).edges.map(edge => edge.id)).toEqual(['a -> b'])
    expect(test.computeView($include('-> a')).edges.map(edge => edge.id)).toEqual(['a -> b'])
  })

  it('includes a bidirectional relationship to the declared source by element kind', () => {
    const { $include } = TestHelper
    const builder = Builder
      .specification({
        elements: {
          component: {},
          database: {},
        },
      })
      .model(({ component, database, rel }, _) =>
        _(
          component('a'),
          database('b'),
          rel('a', 'b', { isBidirectional: true, tail: 'normal' } as any),
        )
      )
    const test = TestHelper.from(builder)

    expect(
      test.computeView($include({
        incoming: {
          elementKind: 'component',
          isEqual: true,
        },
      })).edges.map(edge => edge.id),
    ).toEqual(['a -> b'])
  })

  it('includes a bidirectional relationship to the declared source by element tag', () => {
    const { $include } = TestHelper
    const builder = Builder
      .specification({
        elements: {
          component: {},
          database: {},
        },
        tags: {
          source: {},
        },
      })
      .model(({ component, database, rel }, _) =>
        _(
          component('a', { tags: ['source'] }),
          database('b'),
          rel('a', 'b', { isBidirectional: true, tail: 'normal' } as any),
        )
      )
    const test = TestHelper.from(builder)

    expect(
      test.computeView($include({
        incoming: {
          elementTag: 'source',
          isEqual: true,
        },
      })).edges.map(edge => edge.id),
    ).toEqual(['a -> b'])
  })

  it('includes a styled bidirectional relationship from the declared source', () => {
    const { $include } = TestHelper
    const builder = Builder
      .specification({
        elements: {
          component: {},
        },
      })
      .model(({ component, rel }, _) =>
        _(
          component('a'),
          component('b'),
          rel('a', 'b', { isBidirectional: true, tail: 'diamond' } as any),
        )
      )
    const test = TestHelper.from(builder)

    expect(test.computeView($include('-> a')).edges.map(edge => edge.id)).toEqual(['a -> b'])
  })

  it('excludes a bidirectional relationship from the declared source', () => {
    const { $exclude, $include } = TestHelper
    const builder = Builder
      .specification({
        elements: {
          component: {},
        },
      })
      .model(({ component, rel }, _) =>
        _(
          component('a'),
          component('b'),
          rel('a', 'b', { isBidirectional: true, tail: 'normal' } as any),
        )
      )
    const test = TestHelper.from(builder)

    expect(
      test.computeView(
        $include('*'),
        $exclude('-> a'),
      ).edges.map(edge => edge.id),
    ).toEqual([])
  })

  describe('top level', () => {
    it('include -> amazon.*', () => {
      const { nodeIds, edgeIds } = computeView([$include('-> amazon.*')])
      expect(nodeIds).toEqual([
        'cloud',
        'amazon.s3',
      ])
      expect(edgeIds).to.have.same.members(['cloud:amazon.s3'])
    })

    it('include -> cloud.frontend.*', () => {
      const { nodeIds, edgeIds } = computeView([$include('-> cloud.frontend.*')])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
      ])
      expect(edgeIds).toEqual([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
      ])
    })
  })

  describe('view of cloud', () => {
    it('include -> cloud.frontend.*', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $include('-> cloud.frontend.*'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'email',
        'amazon',
      ])
      expect(edgeIds).toEqual([
        'cloud.backend:email',
        'cloud.backend:amazon',
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
        'cloud.frontend:cloud.backend',
      ])
    })

    it('exclude -> amazon', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> email ->'),
        $exclude('-> amazon'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
      ])
      expect(edgeIds).toEqual([
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.frontend:cloud.backend',
      ])
    })

    // exclude outgoing from cloud
    it('exclude cloud ->', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('email ->'),
        $exclude('cloud ->'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
      ])
      expect(edgeIds).toEqual([
        'customer:cloud.frontend',
        'support:cloud.frontend',
        'cloud.frontend:cloud.backend',
      ])
    })

    it('exclude -> *', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('-> *'),
      ])
      expect(nodeIds).toEqual([
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'email',
        'amazon',
      ])
      expect(edgeIds).toEqual([
        'cloud.frontend:cloud.backend',
        'cloud.backend:email',
        'cloud.backend:amazon',
      ])
    })

    it('exclude -> cloud.frontend.dashboard', () => {
      const { nodeIds, edgeIds } = computeView('cloud', [
        $include('*'),
        $exclude('email'),
        $exclude('-> cloud.frontend.dashboard'),
      ])
      expect(nodeIds).toEqual([
        'support',
        'cloud',
        'cloud.frontend',
        'cloud.backend',
        'amazon',
      ])
      expect(edgeIds).to.have.same.members([
        'cloud.frontend:cloud.backend',
        'support:cloud.frontend',
        'cloud.backend:amazon',
      ])
    })
  })

  describe('view of cloud.frontend', () => {
    it('include -> cloud.backend.*', () => {
      const { nodeIds, edgeIds } = computeView('cloud.frontend', [
        $include('*'),
        $include('-> cloud.backend.*'),
      ])
      expect(nodeIds).toEqual([
        'customer',
        'support',
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.supportPanel',
        'cloud.backend',
        'cloud.backend.graphql',
      ])
      expect(edgeIds).to.have.same.members([
        'customer:cloud.frontend.dashboard',
        'support:cloud.frontend.supportPanel',
        'cloud.frontend.supportPanel:cloud.backend.graphql',
        'cloud.frontend.dashboard:cloud.backend.graphql',
      ])
    })
  })
})
