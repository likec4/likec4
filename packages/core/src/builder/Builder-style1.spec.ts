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
        relTo
      },
      builder
    } = Builder.forSpecification({
      elements: {
        system: {
          style: {
            color: 'green',
            opacity: 10
          }
        },
        component: {
          style: {
            shape: 'browser'
          }
        }
      }
    })

    const b = builder.with(
      model(
        system('s1').with(
          component('c1')
        ),
        system('s2').with(
          component('c1', 'Component s2.1').with(
            component('c2', { title: 'Component s2.1.2' }).with(
              component('c3').with(
                relTo('s1.c1', {
                  title: 'relation from s2.1.2.3 to s1.1'
                })
              )
            ),
            relTo('s1.c1', {
              title: 'relation from s2.1 to s1.1'
            })
          )
        ),
        rel('s1.c1', 's2.c1.c2', {
          title: 'relation from s1.1 to s2.1.2'
        })
      )
    )

    expect(b.build()).toMatchSnapshot()
  })

  it('should build view ', () => {
    const {
      model: {
        model,
        component
      },
      views: {
        view,
        views,
        $include,
        $rules
      },
      builder
    } = Builder.forSpecification({
      elements: {
        component: {}
      }
    })

    const b = builder.with(
      model(
        component('c1'),
        component('c2'),
        component('c3')
      ),
      views(
        view('1', 'View 1', $include('*')),
        view(
          '2',
          'view 2',
          $rules(
            $include('*'),
            $include('c2.*')
          )
        ),
        view('3', '').with(
          $include('c3._')
        )
      )
    )

    expect(b.build()).toMatchSnapshot()
  })
  it('should build viewOf ', () => {
    const {
      model: {
        model,
        component
      },
      views: {
        viewOf,
        views,
        $include,
        $exclude,
        $rules
      },
      builder
    } = Builder.forSpecification({
      elements: {
        component: {}
      }
    })

    const b = builder.with(
      model(
        component('c1'),
        component('c2').with(
          component('c3').with(
            component('c4')
          )
        )
      ),
      views(
        viewOf(
          '1',
          'c1',
          'View 1',
          $rules(
            $include('*'),
            $include('-> c2.c3.* ->'),
            $exclude('c1._ -> c2.c3.*')
          )
        )
      )
    )

    expect(b.build()).toMatchSnapshot()
  })
})
