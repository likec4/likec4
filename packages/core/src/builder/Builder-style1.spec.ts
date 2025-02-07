import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder (style1)', () => {
  it('should build nested elements and relTo', () => {
    const {
      model: {
        model,
        system,
        component,
        rel,
        relTo,
      },
      builder,
    } = Builder.forSpecification({
      elements: {
        system: {
          style: {
            size: 'lg',
            color: 'green',
            opacity: 10,
          },
        },
        component: {
          style: {
            shape: 'browser',
            textSize: 'sm',
          },
        },
      },
    })

    const b = builder.with(
      model(
        system('s1').with(
          component('c1'),
        ),
        system('s2').with(
          component('c1', 'Component s2.1').with(
            component('c2', { title: 'Component s2.1.2' }).with(
              component('c3').with(
                relTo('s1.c1', {
                  title: 'relation from s2.1.2.3 to s1.1',
                }),
              ),
            ),
            relTo('s1.c1', {
              title: 'relation from s2.1 to s1.1',
            }),
          ),
        ),
        rel('s1.c1', 's2.c1.c2', {
          title: 'relation from s1.1 to s2.1.2',
        }),
      ),
    )

    expect(b.build()).toMatchSnapshot()
  })

  it('should build view ', () => {
    const {
      model: {
        model,
        component,
      },
      views: {
        view,
        views,
        $include,
        $rules,
      },
      builder,
    } = Builder.forSpecification({
      elements: {
        component: {},
      },
    })

    const b = builder.with(
      model(
        component('c1'),
        component('c2'),
        component('c3'),
      ),
      views(
        view('1', 'View 1', $include('*')),
        view(
          '2',
          'view 2',
          $rules(
            $include('*'),
            $include('c2.*'),
          ),
        ),
        view('3', '').with(
          $include('c3._'),
        ),
      ),
    )

    expect(b.build()).toMatchSnapshot()
  })

  it('should build viewOf ', () => {
    const {
      model: {
        model,
        component,
      },
      views: {
        viewOf,
        views,
        $include,
        $exclude,
        $rules,
      },
      builder,
    } = Builder.forSpecification({
      elements: {
        component: {},
      },
    })

    const b = builder.with(
      model(
        component('c1'),
        component('c2').with(
          component('c3').with(
            component('c4'),
          ),
        ),
      ),
      views(
        viewOf(
          '1',
          'c1',
          'View 1',
          $rules(
            $include('*'),
            $include('-> c2.c3.* ->'),
            $exclude('c1._ -> c2.c3.*'),
          ),
        ),
      ),
    )

    expect(b.build()).toMatchSnapshot()
  })

  it('should fail on invalid instance ', () => {
    const {
      model: $m,
      deployment: $d,
      builder,
    } = Builder.forSpecification({
      elements: { el: {} },
      deployments: { nd: {} },
    })
    const withmodel = builder.with(
      $m.model(
        $m.el('a'),
        $m.el('a.b'),
        $m.el('a.b.c'),
      ),
    )

    expect(() => {
      const raw = withmodel.with(
        $d.deployment(
          $d.instanceOf('a.b.c'),
        ),
      ).build()
    }).toThrowError('Instance c of a.b.c must be deployed under a parent node')

    // Nested instanceOf is correct

    const raw = withmodel.with(
      $d.deployment(
        $d.nd('node').with(
          $d.instanceOf('a.b'),
        ),
      ),
    ).build()
    expect(raw.deployments.elements).toEqual({
      node: expect.objectContaining({ id: 'node' }),
      // Take name from element
      'node.b': expect.objectContaining({ id: 'node.b', element: 'a.b' }),
    })
  })
})
