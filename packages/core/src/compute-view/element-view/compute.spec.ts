import { indexBy } from 'remeda'
import { describe, expect, it } from 'vitest'
import type { Element, ElementView, Relation, Tag, ViewId, ViewRule } from '../../types'
import { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { $include, fakeElements } from './__test__/fixture'
import { ComputeCtx } from './compute'

function el(id: string): Element {
  return { id } as Element
}

function r(source: string, target: string): Relation {
  return {
    id: `${source}:${target}`,
    source,
    target
  } as Relation
}

function v(rules: ViewRule[]): ElementView {
  return {
    id: 'index' as ViewId,
    title: 'index',
    description: null,
    tags: ['tag' as Tag],
    links: [{ url: 'https://example.com' }],
    rules,
    customColorDefinitions: {}
  } as ElementView
}

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return indexBy(items, e => e.id)
}

describe('compute', () => {
  it('pushes edge to outbound collection of the source and its ancestors', () => {
    const elements = [
      fakeElements['cloud'],
      fakeElements['cloud.backend'],
      fakeElements['cloud.backend.graphql'],
      fakeElements['amazon']
    ]
    const view = v([
      $include('cloud'),
      $include('cloud.*'),
      $include('cloud.backend.*'),
      $include('amazon')
    ])
    const relations = [
      r('cloud.backend.graphql', 'amazon')
    ]
    const graph = new LikeC4ModelGraph({
      elements: toRecord(elements),
      relations: toRecord(relations)
    })

    const context = ComputeCtx.elementView(view, graph)

    expect(context.nodes.find(n => n.id === 'cloud')?.outEdges).includes(relations[0]!.id)
    expect(context.nodes.find(n => n.id === 'cloud.backend')?.outEdges).includes(relations[0]!.id)
    expect(context.nodes.find(n => n.id === 'cloud.backend.graphql')?.outEdges).includes(relations[0]!.id)
  })

  it('does not push edge to in- outbounds of the closest common ancestor', () => {
    const elements = [
      fakeElements['cloud'],
      fakeElements['cloud.backend'],
      fakeElements['cloud.backend.graphql'],
      fakeElements['cloud.frontend'],
      fakeElements['cloud.frontend.dashboard']
    ]
    const view = v([
      $include('cloud'),
      $include('cloud.*'),
      $include('cloud.backend.*'),
      $include('cloud.frontend.*')
    ])
    const relations = [
      r('cloud.backend.graphql', 'cloud.frontend.dashboard')
    ]
    const graph = new LikeC4ModelGraph({
      elements: toRecord(elements),
      relations: toRecord(relations)
    })

    const context = ComputeCtx.elementView(view, graph)

    expect(context.nodes.find(n => n.id === 'cloud')?.outEdges).not.includes(relations[0]!.id)
    expect(context.nodes.find(n => n.id === 'cloud')?.inEdges).not.includes(relations[0]!.id)
  })

  it('pushes edge to inbound collection of the target and its ancestors', () => {
    const elements = [
      fakeElements['cloud'],
      fakeElements['cloud.backend'],
      fakeElements['cloud.backend.graphql'],
      fakeElements['amazon']
    ]
    const view = v([
      $include('cloud'),
      $include('cloud.*'),
      $include('cloud.backend.*'),
      $include('amazon')
    ])
    const relations = [
      r('amazon', 'cloud.backend.graphql')
    ]
    const graph = new LikeC4ModelGraph({
      elements: toRecord(elements),
      relations: toRecord(relations)
    })

    const context = ComputeCtx.elementView(view, graph)

    expect(context.nodes.find(n => n.id === 'cloud')?.inEdges).includes(relations[0]!.id)
    expect(context.nodes.find(n => n.id === 'cloud.backend')?.inEdges).includes(relations[0]!.id)
    expect(context.nodes.find(n => n.id === 'cloud.backend.graphql')?.inEdges).includes(relations[0]!.id)
  })

  it('sets edge parent to closest common ancestor', () => {
    const elements = [
      fakeElements['cloud'],
      fakeElements['cloud.backend'],
      fakeElements['cloud.backend.graphql'],
      fakeElements['cloud.frontend'],
      fakeElements['cloud.frontend.dashboard']
    ]
    const view = v([
      $include('cloud'),
      $include('cloud.*'),
      $include('cloud.backend.*'),
      $include('cloud.frontend.*')
    ])
    const relations = [
      r('cloud.backend.graphql', 'cloud.frontend.dashboard')
    ]
    const graph = new LikeC4ModelGraph({
      elements: toRecord(elements),
      relations: toRecord(relations)
    })

    const context = ComputeCtx.elementView(view, graph)

    expect(context.edges[0]!.parent).toBe('cloud')
  })
})
