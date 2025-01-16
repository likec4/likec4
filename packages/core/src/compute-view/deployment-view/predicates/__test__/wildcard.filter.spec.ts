import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('Wildcard', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
        app: {}
      },
      tags: ['next', 'alpha', 'beta', 'omega'],
      deployments: {
        nd: {},
        vm: {},
      },
    })
    .model(({ el, app }, _) =>
      _(
        el('customer', { tags: ['next'] }),
        el('cloud'),
        el('cloud.ui'),
        app('cloud.ui.app', { tags: ['next'] }),
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

  const { $include, $exclude } = TestHelper

  const t = TestHelper.from(builder.deployment(({ nd, instanceOf, vm }, d) =>
    d(
      nd('customer').with(
        instanceOf('customer'),
      ),
      nd('prod', { tags: ['alpha'] }),
      nd('prod.z1').with(
        instanceOf('cloud.ui.app'),
        instanceOf('cloud.backend.api'),
        instanceOf('cloud.backend.service'),
      ),
      nd('prod.infra').with(
        instanceOf('infra.db'),
        instanceOf('email', 'infra.email', { tags: ['alpha'] }),
      ),
      nd('global').with(
        instanceOf('integrators'),
      ),
      vm('dev').with(
        instanceOf('cloud.ui.app'),
        instanceOf('cloud.backend.api'),
        instanceOf('cloud.backend.service'),
        instanceOf('infra.db'),
        instanceOf('infra.email'),
      ),
    )
  ))

  describe('include * where', () => {
    describe('kind is', () => {
      // Wildcard filters could not be applied to instances as instances are always wrapped into deployment node
      // it('should include instance when model kind matches', () => {})
      // it('should not include instance when model kind does not match', () => {})

      it('should include node when node kind matches', () => {
        t.expectComputedView(
          $include('*', { where: 'kind is vm' }),
        ).toHaveNodes(
          'dev',
          'dev.app',
          'dev.api',
          'dev.service',
          'dev.db',
          'dev.email',
        )
      })
    })

    describe('tag is', () => {
      // Wildcard filters could not be applied to instances as instances are always wrapped into deployment node
      // it('should include instance when model tag matches', () => {})
      // it('should include instance when instance tag matches', () => {})
      // it('should not include instance when neither model nor instance tag does not match', () => {})

      it('should include node when tag matches', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #alpha' }),
        ).toHaveNodes(
          'prod',
          'prod.z1',
          'prod.infra',
        )
      })

      it('should not include node when tag does not match', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #omega' }),
        ).toHaveNodes()
      })
    })
  })

  describe('exclude *', () => {
    describe('tag is', () => {
      it('should exclude staged node when tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #alpha' }),
        ).toHaveNodes(
          'prod.z1',
          'prod.z1.app',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
        )
      })
      it('should not exclude staged node when tag does not match', () => {
        t.expectComputedView(
          $include('customer'),
          $include('dev'),
          $include('dev._'),
          $exclude('*', { where: 'tag is #alpha' }),
        ).toHaveNodes(
          'customer',
          'dev',
          'dev.app',
          'dev.api',
          'dev.service',
          'dev.db',
          'dev.email',
        )
      })
      it('should exclude staged instance when model tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #next' }),
        ).toHaveNodes(
          'prod',
          'prod.z1',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })
      it('should exclude staged instance when deployment tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #alpha' }),
        ).toHaveNodes(
          'prod.z1',
          'prod.z1.app',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
        )
      })
      it('should not exclude staged instance when neither model or deployment tag does not match', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #omega' }),
        ).toHaveNodes(
          'prod',
          'prod.z1',
          'prod.z1.app',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })
    })

    describe('kind is', () => {
      it('should exclude staged node when kind matches', () => {
        t.expectComputedView(
          $include('dev'),
          $include('dev.**'),
          $exclude('*', { where: 'kind is vm' }),
        ).toHaveNodes(
          'dev.app',
          'dev.api',
          'dev.service',
          'dev.db',
          'dev.email',
        )
      })
      it('should not exclude staged node when kind does not match', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'kind is vm' }),
        ).toHaveNodes(
          'prod',
          'prod.z1',
          'prod.z1.app',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })
      it('should exclude staged instance when model kind matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'kind is app' }),
        ).toHaveNodes(
          'prod',
          'prod.z1',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })
      it('should not exclude staged instance when modelkind does not match', () => {})
    })
  })
})
