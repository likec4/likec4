import { only, values } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { invariant } from '../../errors'
import { LikeC4Model } from '../../model'
import { isElementView } from '../../types'
import { withReadableEdges } from '../utils/with-readable-edges'
import { computeElementView } from './compute'

const builder = Builder.specification({
  elements: {
    el: {}
  }
})

function compute(buider: Builder<any>) {
  const { views, ...model } = buider.build()
  const likec4model = LikeC4Model.create({ ...model, views: {} })
  const view = only(values(views))
  invariant(view && isElementView(view), 'Must have one element view')
  return withReadableEdges(computeElementView(likec4model, view))
}

describe('compute', () => {
  it('pushes edge to outbound collection of the source and its ancestors', () => {
    const context = compute(
      builder
        .model(({ el, rel }, _) =>
          _(
            el('cloud').with(
              el('backend').with(
                el('graphql'),
                el('db')
              )
            ),
            el('amazon'),
            rel('cloud.backend.graphql', 'amazon')
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
                $include('amazon')
              )
            )
          )
        )
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
            rel('cloud.backend.graphql', 'cloud.frontend.dashboard')
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
                $include('cloud.frontend.*')
              )
            )
          )
        )
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
            rel('amazon', 'cloud.backend.graphql')
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
                $include('amazon')
              )
            )
          )
        )
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
            rel('cloud.backend.graphql', 'cloud.frontend.dashboard')
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
                $include('cloud.frontend.*')
              )
            )
          )
        )
    )

    expect(context.edges[0]!.parent).toBe('cloud')
  })
})
