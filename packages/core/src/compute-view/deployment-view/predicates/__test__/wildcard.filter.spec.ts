import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('Wildcard Where', () => {
  const builder = Builder
    .specification({
      elements: ['el', 'app'],
      tags: ['tag-on-model', 'tag-on-instance', 'tag-on-node', 'unused'],
      deployments: ['nd', 'vm'],
    })
    .model(({ el, app }, _) =>
      _(
        el('customer', { tags: ['tag-on-model'] }),
        el('cloud'),
        el('cloud.ui'),
        app('cloud.ui.app', { tags: ['tag-on-model'] }),
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
      nd('prod'),
      nd('prod.z1', { tags: ['tag-on-node'] }).with(
        instanceOf('cloud.ui.app'),
        instanceOf('api', 'cloud.backend.api', { tags: ['tag-on-instance'] }),
        instanceOf('service', 'cloud.backend.service', { tags: ['tag-on-instance'] }),
      ),
      nd('prod.infra').with(
        instanceOf('infra.db'),
        instanceOf('infra.email'),
      ),
      nd('global', { tags: ['tag-on-node'] }).with(
        instanceOf('integrators'),
      ),
      vm('dev').with(
        instanceOf('cloud.ui.app'),
        instanceOf('api', 'cloud.backend.api', { tags: ['tag-on-instance'] }),
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
        )

        t.expectComputedView(
          $include('*', { where: 'kind is nd' }),
        ).toHaveNodes(
          'prod',
          'prod.infra',
          'customer',
          'global',
          'prod.z1',
        )
      })
    })

    describe('tag is', () => {
      it('should include instance when model tag matches', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #tag-on-model' }),
        ).toHave({
          nodes: [
            'customer.customer',
            'prod',
            'dev',
            'prod.z1.app',
            'dev.app',
          ],
          edges: [
            'customer.customer -> prod.z1.app',
            'customer.customer -> dev.app',
          ],
        })
      })

      it('should include instance when instance tag matches', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #tag-on-instance' }),
        ).toHave({
          nodes: [
            'prod.z1',
            'prod.z1.api',
            'prod.z1.service',
            'dev.api',
          ],
          edges: [
            'prod.z1.api -> prod.z1.service',
          ],
        })
      })

      it('should include node when tag matches', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #tag-on-node' }),
        ).toHave({
          nodes: [
            'global',
            'prod',
            'prod.z1',
          ],
          edges: [
            'global -> prod.z1',
          ],
        })
      })

      it('should not include any when tag does not match', () => {
        t.expectComputedView(
          $include('*', { where: 'tag is #unused' }),
        ).toHaveNodes()
      })

      it('should include and connect with existing nodes', () => {
        t.expectComputedView(
          $include('customer.customer'),
          $include('*', { where: 'tag is #tag-on-node' }),
        ).toHave({
          edges: [
            'customer.customer -> prod.z1',
            'global -> prod.z1',
          ],
          nodes: [
            'customer.customer',
            'global',
            'prod',
            'prod.z1',
          ],
        })
      })
    })
  })

  describe('exclude *', () => {
    describe('tag is', () => {
      it('should exclude node when tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #tag-on-node' }),
        ).toHaveNodes(
          'prod',
          'prod.z1.app',
          'prod.z1.api',
          'prod.z1.service',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })

      it('should exclude instance when model tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #tag-on-model' }),
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

      it('should exclude instance when instance tag matches', () => {
        t.expectComputedView(
          $include('prod'),
          $include('prod.**'),
          $exclude('*', { where: 'tag is #tag-on-instance' }),
        ).toHaveNodes(
          'prod',
          'prod.z1.app',
          'prod.infra',
          'prod.infra.db',
          'prod.infra.email',
        )
      })

      it('should not exclude when tag does not match', () => {
        t.expectComputedView(
          $include('customer'),
          $include('dev'),
          $include('dev._'),
          $exclude('*', { where: 'tag is #unused' }),
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
