import { only, values } from 'remeda'
import { describe, expect, it } from 'vitest'
import { type AnyTypes, type Types, Builder } from '../../builder'
import { LikeC4Model } from '../../model'
import { type ParsedView, isElementView } from '../../types'
import { invariant } from '../../utils'
import { withReadableEdges } from '../utils/with-readable-edges'
import { computeElementView } from './compute'

const builder = Builder.specification({
  elements: {
    el: {},
    actor: {
      tags: ['tag1'],
    },
  },
  tags: {
    tag1: {},
    tag2: {},
  },
})

function compute<const T extends AnyTypes>(builder: Builder<T>) {
  const parsed = builder.build()
  const likec4model = LikeC4Model.create(parsed)
  const view = only(values(parsed.views as Record<string, ParsedView<Types.ToAux<T>>>))
  invariant(view && isElementView(view), 'Must have one element view')
  return withReadableEdges(computeElementView(likec4model, view))
}

describe('compute', () => {
  it('adds tags to node from element and spec', () => {
    const context = compute(
      builder
        .model(({ actor }, _) =>
          _(
            actor('alice'),
            actor('bob', {
              tags: ['tag2'],
            }),
          )
        )
        .views(({ view, $include, $rules, $style }, _) =>
          _(
            view(
              'index',
              'index',
              $rules(
                $include('*'),
                $style(['*', 'alice'], {}),
              ),
            ),
          )
        ),
    )
    expect(context.nodes.find(n => n.id === 'alice')?.tags).toEqual(['tag1'])
    // Tags are merged, order is important (tag2 comes from element, tag1 comes from spec)
    expect(context.nodes.find(n => n.id === 'bob')?.tags).toEqual(['tag2', 'tag1'])
  })

  it('pushes edge to outbound collection of the source and its ancestors', () => {
    const context = compute(
      builder
        .model(({ el, rel }, _) =>
          _(
            el('cloud').with(
              el('backend').with(
                el('graphql'),
                el('db'),
              ),
            ),
            el('amazon'),
            rel('cloud.backend.graphql', 'amazon'),
          )
        )
        .views(({ view, $include, $rules }, _) =>
          _(
            view(
              'index',
              'index',
              $rules(
                $include('cloud'),
                $include('cloud.*'),
                $include('cloud.backend.*'),
                $include('amazon'),
              ),
            ),
          )
        ),
    )
    const expected = ['cloud.backend.graphql:amazon']
    expect(context.nodes.find(n => n.id === 'cloud')?.outEdges).toEqual(expected)
    expect(context.nodes.find(n => n.id === 'cloud.backend')?.outEdges).toEqual(expected)
    expect(context.nodes.find(n => n.id === 'cloud.backend.graphql')?.outEdges).toEqual(expected)
  })

  it('does not push edge to in- outbounds of the closest common ancestor', () => {
    const context = compute(
      builder
        .model(({ el, rel }, _) =>
          _(
            el('cloud'),
            el('cloud.backend'),
            el('cloud.backend.graphql'),
            el('cloud.frontend'),
            el('cloud.frontend.dashboard'),
            rel('cloud.backend.graphql', 'cloud.frontend.dashboard'),
          )
        )
        .views(({ view, $include, $rules }, _) =>
          _(
            view(
              'index',
              'index',
              $rules(
                $include('cloud'),
                $include('cloud.*'),
                $include('cloud.backend.*'),
                $include('cloud.frontend.*'),
              ),
            ),
          )
        ),
    )

    const expected = 'cloud.backend.graphq:cloud.frontend.dashboard'
    expect(context.nodes.find(n => n.id === 'cloud')?.outEdges).not.includes(expected)
    expect(context.nodes.find(n => n.id === 'cloud')?.inEdges).not.includes(expected)
  })

  it('pushes edge to inbound collection of the target and its ancestors', () => {
    const context = compute(
      builder
        .model(({ el, rel }, _) =>
          _(
            el('cloud'),
            el('cloud.backend'),
            el('cloud.backend.graphql'),
            el('amazon'),
            rel('amazon', 'cloud.backend.graphql'),
          )
        )
        .views(({ view, $include, $rules }, _) =>
          _(
            view(
              'index',
              'index',
              $rules(
                $include('cloud'),
                $include('cloud.*'),
                $include('cloud.backend.*'),
                $include('amazon'),
              ),
            ),
          )
        ),
    )

    const expected = ['amazon:cloud.backend.graphql']
    expect(context.nodes.find(n => n.id === 'cloud')?.inEdges).toEqual(expected)
    expect(context.nodes.find(n => n.id === 'cloud.backend')?.inEdges).toEqual(expected)
    expect(context.nodes.find(n => n.id === 'cloud.backend.graphql')?.inEdges).toEqual(expected)
  })

  it('sets edge parent to closest common ancestor', () => {
    const context = compute(
      builder
        .model(({ el, rel }, _) =>
          _(
            el('cloud'),
            el('cloud.backend'),
            el('cloud.backend.graphql'),
            el('cloud.frontend'),
            el('cloud.frontend.dashboard'),
            rel('cloud.backend.graphql', 'cloud.frontend.dashboard'),
          )
        )
        .views(({ view, $include, $rules }, _) =>
          _(
            view(
              'index',
              'index',
              $rules(
                $include('cloud'),
                $include('cloud.*'),
                $include('cloud.backend.*'),
                $include('cloud.frontend.*'),
              ),
            ),
          )
        ),
    )

    expect(context.edges[0]!.parent).toBe('cloud')
  })
})
