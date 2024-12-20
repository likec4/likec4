import { test } from 'vitest'
import { Builder } from '../../../builder'
import { TestHelper } from './TestHelper'

test('Reproduce #1362', () => {
  const t = TestHelper.from(
    Builder.specification({
      elements: {
        el: {},
      },
      deployments: {
        cluster: {},
        env: {},
        k8s: {},
      },
    })
      .model(({ el, rel }, _) =>
        _(
          el('sys1'),
          el('sys1.sys11'),
          el('sys2'),
          el('sys2.sys21'),
          el('sys3'),
          rel('sys1.sys11', 'sys2.sys21', 'text1'),
        )
      )
      .deployment(({ env, cluster, k8s, instanceOf }, _) =>
        _(
          env('prod'),
          cluster('prod.c1').with(
            k8s('k8s').with(
              instanceOf('i1', 'sys1.sys11'),
              instanceOf('i2', 'sys2.sys21'),
            ),
          ),
          cluster('prod.c2').with(
            k8s('k8s').with(
              instanceOf('i1', 'sys1.sys11'),
              instanceOf('i2', 'sys2.sys21'),
            ),
          ),
        )
      ),
  )
  const view = t.computeView(
    t.$include('*'),
    t.$include('prod.**'),
  )

  t.expect(view).toHaveNodes(
    'prod',
    // 'prod.c1', no boundary, no explicit
    // 'prod.c2',
    'prod.c1.k8s',
    'prod.c2.k8s',
    'prod.c1.k8s.i1',
    'prod.c2.k8s.i1',
    'prod.c1.k8s.i2',
    'prod.c2.k8s.i2',
  )
})
