import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder (style 2)', () => {
  const spec = Builder
    .specification({
      elements: {
        system: {
          style: {
            size: 'lg',
            textSize: 'sm',
          },
        },
        component: {},
        actor: {
          tags: ['tag3'],
        },
      },
      deployments: {
        env: {
          style: {
            size: 'lg',
          },
        },
        node: {},
      },
      tags: {
        tag1: {
          color: '#FFF',
        },
        tag2: {},
        tag3: {},
      },
    })

  it('should fail on invalid tag in element spec', () => {
    expect(() => {
      Builder.specification({
        elements: {
          system: {
            tags: ['tag1', 'tag2'],
          },
        },
        tags: {
          tag1: {},
        },
      })
    }).toThrowError('Invalid specification for element kind "system": tag "tag2" not found')
  })

  it('should fail on invalid tag in deployment spec', () => {
    expect(() => {
      Builder.specification({
        elements: {},
        deployments: {
          node: {
            tags: ['tag1', 'tag2'],
          },
        },
        tags: {
          tag1: {},
        },
      })
    }).toThrowError('Invalid specification for deployment kind "node": tag "tag2" not found')
  })

  it('should build ', () => {
    const b = spec.clone()
      .model(({ system, actor, component }, _) =>
        _(
          actor('customer'),
          system('cloud').with(
            component('ui'),
          ),
        )
      )
      .deployment(({ env, node, instanceOf }, _) =>
        _(
          env('prod').with(
            node('eu').with(
              instanceOf('cloud.ui'),
            ),
          ),
          env('dev'),
          node('dev.local'),
        )
      )
      .views(({ view, viewOf, deploymentView, $include }, _) =>
        _(
          view('index', 'Index').with(
            $include('cloud.*'),
          ),
          viewOf('cloud', 'cloud.ui').with(
            $include('* -> cloud.**'),
          ),
          deploymentView('deployment', 'Deployment').with(
            $include('prod.**'),
          ),
        )
      )

    expect(b.build()).toMatchSnapshot()
  })

  it('should fail if invalid ID provided ', () => {
    expect(() => {
      spec.model(({ actor }, _) =>
        _(
          actor('cust.omer'),
        )
      )
    }).toThrowError('Parent element with id "cust" not found for element with id "cust.omer"')
  })

  it('should fail on invalid instance ', () => {
    const b = spec.clone()
      .model(_ =>
        _.model(
          _.component('cloud'),
          _.component('cloud.ui'),
        )
      )

    expect(() => {
      const raw = b.deployment(_ =>
        _.deployment(
          _.instanceOf('cloud.ui'),
        )
      ).build()
    }).toThrowError('Instance ui of cloud.ui must be deployed under a parent node')

    // Nested instanceOf is correct

    const raw = b.deployment(_ =>
      _.deployment(
        _.node('node').with(
          _.instanceOf('cloud.ui'),
        ),
      )
    ).build()
    expect(raw.deployments.elements).toEqual({
      node: expect.objectContaining({ id: 'node' }),
      // Take name from element
      'node.ui': expect.objectContaining({ id: 'node.ui', element: 'cloud.ui' }),
    })
  })

  it('should build and compute LikeC4Model', async ({ expect }) => {
    const m = spec.clone()
      .model(({ system, actor, component, relTo, rel }, _) =>
        _(
          actor('customer'),
          system('cloud').with(
            component('ui'),
            component('api'),
          ),
          rel('customer', 'cloud.ui', {
            title: 'uses',
            tags: ['tag1'],
          }),
          rel('cloud.ui', 'cloud.api', {
            title: 'calls',
            tags: ['tag2'],
          }),
        )
      )
      .views(({ view, viewOf, $include }, _) =>
        _(
          view('index', 'Index').with(
            $include('*'),
          ),
          viewOf('cloudui', 'cloud.ui').with(
            $include('*'),
          ),
        )
      )
      .toLikeC4Model()

    await expect(m.$data).toMatchFileSnapshot('__snapshots__/Builder-style2.compute-model.json5')
  })
})
