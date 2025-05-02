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
        actor: {},
      },
      deployments: {
        env: {
          style: {
            size: 'lg',
          },
        },
        node: {},
      },
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

  it('should build activities', ({ expect }) => {
    const b = spec.clone()
      .model(_ =>
        _.model(
          _.component('s1').with(
            _.activity('A'),
            _.component('c1'),
          ),
          _.component('s2').with(
            _.activity('B'),
            _.component('c2'),
          ),
          _.activity('s2.c2#C'),
        )
      )

    expect(b.build()).toMatchSnapshot()
  })

  it('should build activities with title', ({ expect }) => {
    expect(
      spec.clone()
        .model(_ =>
          _.model(
            _.component('s1').with(
              _.activity('A', {
                title: 'Title A',
              }),
            ),
          )
        ).build(),
    ).toMatchSnapshot()
  })

  it('should build activities with steps (array)', ({ expect }) => {
    expect(
      spec.clone()
        .model(_ =>
          _.model(
            _.component('s1').with(
              _.component('c1'),
            ),
            _.component('s2').with(
              _.component('c2'),
            ),
            _.activity('s2.c2#C', [
              _.step('-> s1.c1'),
              _.step('<- s1.c1'),
            ]),
          )
        ).build(),
    ).toMatchSnapshot()
  })

  it('should build activities with steps (string array)', ({ expect }) => {
    expect(
      spec.clone().model(_ =>
        _.model(
          _.component('s1'),
          _.component('s2').with(
            _.activity('B'),
          ),
          _.activity('s1#A', [
            '-> s2#B',
          ]),
        )
      ).build(),
    ).toMatchSnapshot()
  })

  it('should build activities with steps (object)', ({ expect }) => {
    expect(
      spec.clone().model(_ =>
        _.model(
          _.component('s1'),
          _.component('s2').with(
            _.activity('B'),
          ),
          _.activity('s1#A', {
            steps: [
              ['-> s2#B', 'title1'],
              ['<- s2#B', {
                title: 'title2',
              }],
            ],
          }),
        )
      ).build(),
    ).toMatchSnapshot()
  })
})
