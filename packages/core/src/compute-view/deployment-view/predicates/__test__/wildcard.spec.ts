import { describe, test } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('Wildcard', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        nd: {},
        vm: {},
      },
    })
    .model(({ el }, _) =>
      _(
        el('customer'),
        el('cloud'),
        el('cloud.ui'),
        el('cloud.ui.app'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.backend.service'),
        el('infra'),
        el('infra.db'),
        el('infra.email'),
        el('integrators'),
      )
    )
    .model(({ rel }, m) =>
      m(
        rel('customer', 'cloud'),
        rel('customer', 'cloud.ui.app'),
        rel('cloud.backend.api', 'cloud.backend.service'),
        rel('cloud.backend.service', 'infra.db'),
        rel('cloud.backend.service', 'infra.email'),
        rel('cloud.ui.app', 'cloud.backend.api'),
        rel('cloud', 'infra'),
        rel('infra.email', 'customer'),
        rel('integrators', 'cloud.backend.api'),
        rel('infra.email', 'integrators'),
      )
    )

  const { $include } = TestHelper

  test('include *', () => {
    const t = TestHelper.from(builder.deployment(({ nd, instanceOf }, d) =>
      d(
        nd('customer').with(
          instanceOf('customer'),
        ),
        nd('prod'),
        nd('prod.z1').with(
          instanceOf('cloud.ui.app'),
          instanceOf('cloud.backend.api'),
          instanceOf('cloud.backend.service'),
        ),
        nd('prod.infra').with(
          instanceOf('infra.db'),
          instanceOf('infra.email'),
        ),
        nd('global').with(
          instanceOf('integrators'),
        ),
      )
    ))
    const state = t.processPredicates(
      $include('*'),
    )
    t.expect(state).toHaveFinalElements(
      'customer',
      'prod',
      'global',
      'prod.z1',
      'prod.infra',
    )
    t.expect(state).toHaveConnections(
      'customer -> prod.z1',
      'prod.infra -> customer',
      'global -> prod.z1',
      'prod.infra -> global',
      'prod.z1 -> prod.infra',
    )
  })

  test('include * (two zones)', () => {
    const t = TestHelper.from(builder.deployment(({ nd, instanceOf }, d) =>
      d(
        nd('customer').with(
          instanceOf('customer'),
        ),
        nd('prod'),
        nd('prod.z1').with(
          instanceOf('cloud.ui.app'),
          instanceOf('cloud.backend.api'),
          instanceOf('cloud.backend.service'),
        ),
        nd('prod.z2').with(
          instanceOf('cloud.ui.app'),
        ),
        nd('prod.infra').with(
          instanceOf('infra.db'),
          instanceOf('infra.email'),
        ),
        nd('global').with(
          instanceOf('integrators'),
        ),
      )
    ))
    const state = t.processPredicates(
      $include('*'),
    )
    t.expect(state).toHaveFinalElements(
      'customer',
      'prod',
      'global',
      'prod.z1',
      'prod.z2',
      'prod.infra',
    )
    t.expect(state).toHaveConnections(
      'customer -> prod.z1',
      'customer -> prod.z2',
      'prod.infra -> customer',
      'global -> prod.z1',
      'prod.infra -> global',
      'prod.z1 -> prod.infra',
    )
  })
})
