import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('Wildcard predicate', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      tags: ['web', 'mobile', 'top'],
    })
    .model(({ el }, _) =>
      _(
        el('customer'),
        el('cloud', {
          tags: ['top'],
        }),
        el('cloud.frontend'),
        el('cloud.frontend.dashboard', {
          tags: ['web'],
        }),
        el('cloud.frontend.mobile', {
          tags: ['mobile'],
        }),
        el('cloud.auth'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('aws', {
          tags: ['top'],
        }),
        el('aws.rds'),
      )
    )
    .model(({ rel }, m) =>
      m(
        rel('customer', 'cloud', 'uses services'),
        rel('customer', 'cloud.frontend.mobile', 'opens mobile app'),
        rel('customer', 'cloud.frontend.dashboard', 'opens in browser'),
        rel('cloud', 'aws'),
        rel('cloud.frontend.dashboard', 'cloud.auth', 'authenticates'),
        rel('cloud.frontend.dashboard', 'cloud.backend.api', 'fetches data'),
        rel('cloud.frontend.mobile', 'cloud.auth', 'authenticates'),
        rel('cloud.frontend.mobile', 'cloud.backend.api', 'fetches data'),
        rel('cloud.frontend', 'cloud.backend', 'fetches data'),
        rel('cloud.backend.api', 'cloud.auth', 'authorizes'),
        rel('cloud.backend.api', 'aws.rds', 'reads/writes'),
      )
    )

  const { $include, $exclude, $rules } = TestHelper

  describe('without scope', () => {
    it('include *', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicates(
        $rules(
          $include('*'),
        ),
      )
      t.expect(state).toHaveElements(
        'customer',
        'cloud',
        'aws',
      )
      t.expect(state).toHaveConnections(
        'customer -> cloud',
        'cloud -> aws',
      )
    })

    it('include * where', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicates(
        $rules(
          $include('*', {
            where: 'tag is #top',
          }),
        ),
      )
      t.expect(state).toHaveElements(
        'cloud',
        'aws',
      )
      t.expect(state).toHaveConnections(
        'cloud -> aws',
      )
    })

    it('include * where not', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicates(
        $rules(
          $include('*', {
            where: 'tag is not #top',
          }),
        ),
      )
      t.expect(state).toHaveElements(
        'customer',
      )
      t.expect(state.memory.connections).toBeEmpty()
    })
  })

  describe('with scope', () => {
    it('include * in cloud', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicatesWithScope(
        'cloud',
        $include('*'),
      )
      t.expect(state).toHaveElements(
        'cloud',
        'cloud.frontend',
        'cloud.auth',
        'cloud.backend',
        'customer',
        'aws',
      )
      t.expect(state).toHaveConnections(
        'cloud.frontend -> cloud.auth',
        'cloud.frontend -> cloud.backend',
        'cloud.backend -> cloud.auth',
        'customer -> cloud.frontend',
        'cloud.backend -> aws',
      )
    })

    it('include * in cloud.frontend', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicatesWithScope(
        'cloud.frontend',
        $include('*'),
      )
      t.expect(state).toHaveElements(
        'cloud.frontend',
        'cloud.frontend.dashboard',
        'cloud.frontend.mobile',
        'cloud.auth',
        'cloud.backend',
        'customer',
      )
      t.expect(state).toHaveConnections(
        'cloud.frontend.dashboard -> cloud.auth',
        'cloud.frontend.dashboard -> cloud.backend',
        'customer -> cloud.frontend.dashboard',
        'cloud.frontend.mobile -> cloud.auth',
        'cloud.frontend.mobile -> cloud.backend',
        'customer -> cloud.frontend.mobile',
      )
    })

    it('include * in cloud.frontend.dashboard', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicatesWithScope(
        'cloud.frontend.dashboard',
        $include('*'),
      )
      t.expect(state).toHaveElements(
        'cloud.frontend.dashboard',
        'cloud.frontend',
        'cloud.auth',
        'cloud.backend',
        'customer',
      )
      t.expect(state).toHaveConnections(
        'cloud.frontend.dashboard -> cloud.auth',
        'cloud.frontend.dashboard -> cloud.backend',
        'customer -> cloud.frontend.dashboard',
      )
    })

    it('include * in scope', () => {
      const t = TestHelper.from(builder.clone())
      const state = t.processPredicatesWithScope(
        'cloud',
        $rules(
          $include('*'),
          $include('cloud.frontend.dashboard'),
        ),
      )
      t.expect(state).toHaveElements(
        'cloud',
        'cloud.frontend',
        'cloud.auth',
        'cloud.backend',
        'customer',
        'aws',
        'cloud.frontend.dashboard',
      )
      t.expect(state).toHaveConnections(
        'cloud.backend -> cloud.auth',
        'cloud.backend -> aws',
        'customer -> cloud.frontend.dashboard',
        'cloud.frontend.dashboard -> cloud.auth',
        'cloud.frontend.dashboard -> cloud.backend',
      )
    })
  })
})
