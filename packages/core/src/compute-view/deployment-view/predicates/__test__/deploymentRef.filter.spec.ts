import { describe, expect, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('DeploymentRef', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
        app: {},
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
      nd('prod.infra', { tags: ['beta'] }).with(
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

  describe('include', () => {
    describe('instance where', () => {
      describe('kind is', () => {
        it('should include instance when model kind matches', () => {
          t.expectComputedView(
            $include('prod.z1.app', { where: 'kind is app' }),
          ).toHaveNodes(
            'prod.z1.app',
          )
        })
        it('should not include instance when model kind does not match', () => {
          t.expectComputedView(
            $include('prod.z1.service', { where: 'kind is app' }),
          ).toHaveNodes()
        })
      })

      describe('tag is', () => {
        it('should include instance when model tag matches', () => {
          t.expectComputedView(
            $include('prod.z1.app', { where: 'tag is #next' }),
          ).toHaveNodes(
            'prod.z1.app',
          )
        })
        it('should include instance when deployment tag matches', () => {
          t.expectComputedView(
            $include('prod.infra.email', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'prod.infra.email',
          )
        })
        it('should not include instance when neither model nor instance tag does not match', () => {
          t.expectComputedView(
            $include('prod.z1.app', { where: 'tag is #omega' }),
          ).toHaveNodes()
        })
      })
    })

    describe('node where', () => {
      describe('tag is', () => {
        it('should include node when tag matches', () => {
          t.expectComputedView(
            $include('prod', { where: 'tag is #alpha' }),
            $include('prod.infra', { where: 'tag is #beta' }),
          ).toHaveNodes(
            'prod',
            'prod.infra',
          )
        })
        it('should not include node when tag does not match', () => {
          t.expectComputedView(
            $include('prod', { where: 'tag is #omega' }),
            $include('prod.infra', { where: 'tag is #omega' }),
          ).toHaveNodes()
        })
      })
    })

    describe('node._ where', () => {
      describe('tag is', () => {
        it('should include child when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
          )
        })
        it('should include child when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.infra._', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'prod',
            'prod.infra',
            'prod.infra.email',
            'customer',
          )
        })
        it('should not include child when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._', { where: 'tag is #omega' }),
            $include('prod.infra._', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.infra',
          )
        })
      })
    })

    describe('node.* where', () => {
      describe('tag is', () => {
        it('should include child when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1.*', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1.app',
          )
        })
        it('should include child when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.infra.*', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'prod',
            'prod.infra.email',
            'customer',
          )
        })
        it('should not include child when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1.*', { where: 'tag is #omega' }),
            $include('prod.infra.*', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
          )
        })
      })
    })

    describe('node.** where', () => {
      describe('tag is', () => {
        it('should include descendant instance when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.**', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1.app',
          )
        })
        it('should include descendant when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.**', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'prod',
            'prod.infra.email',
            'customer',
          )
        })
        it('should not include descendant when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.**', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
          )
        })
      })
    })
  })

  describe('exclude', () => {
    describe('instance where', () => {
      describe('tag is', () => {
        it('should exclude instance when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $exclude('prod.z1.app', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.api',
            'prod.z1.service',
          )
        })
        it('should exclude instance when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.infra._'),
            $exclude('prod.infra.email', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.infra',
          )
        })
        it('should not exclude instance when neither model nor instance tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $exclude('prod.z1.app', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
          )
        })
      })
    })

    describe('node where', () => {
      describe('tag is', () => {
        it('should exclude node when tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra', { where: 'tag is #beta' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
            'prod.infra.db',
            'prod.infra.email',
          )
        })
        it('should not exclude node when tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
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
    })

    describe('node._ where', () => {
      describe('tag is', () => {
        it('should exclude child when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $exclude('prod.z1._', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.api',
            'prod.z1.service',
          )
        })
        it('should exclude child when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra._', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
            'prod.infra',
            'prod.infra.db',
          )
        })
        it('should not exclude child when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra._', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
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
    })

    describe('node.* where', () => {
      describe('tag is', () => {
        it('should exclude child when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $exclude('prod.z1.*', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.api',
            'prod.z1.service',
          )
        })
        it('should exclude child when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra.*', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
            'prod.infra',
            'prod.infra.db',
          )
        })
        it('should not exclude child when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.infra.*', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
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
    })

    describe('node.** where', () => {
      describe('tag is', () => {
        it('should exclude descendant when model tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $exclude('prod.**', { where: 'tag is #next' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.api',
            'prod.z1.service',
          )
        })
        it('should exclude descendant instances when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.**', { where: 'tag is #alpha' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
            'prod.infra',
            'prod.infra.db',
          )
        })
        it('should exclude descendant nodes when deployment tag matches', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.**', { where: 'tag is #beta' }),
          ).toHaveNodes(
            'customer',
            'prod',
            'prod.z1',
            'prod.z1.app',
            'prod.z1.api',
            'prod.z1.service',
            'prod.infra.db',
            'prod.infra.email',
          )
        })
        it('should not exclude descendant when neither model nor deployment tag does not match', () => {
          t.expectComputedView(
            $include('customer'),
            $include('prod.z1._'),
            $include('prod.infra._'),
            $exclude('prod.**', { where: 'tag is #omega' }),
          ).toHaveNodes(
            'customer',
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
    })
  })
})
