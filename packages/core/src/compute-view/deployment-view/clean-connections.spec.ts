import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'
import { findCrossBoundaryConnections, findRedundantConnections } from './clean-connections'

describe('Clean Connections', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        node: {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('client'),
        el('cloud'),
        el('cloud.ui'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.db'),
        rel('client', 'cloud.ui'),
        rel('cloud.ui', 'cloud.backend.api'),
        rel('cloud.backend.api', 'cloud.db'),
      )
    )

  const deploymentModel = builder.deployment((_, deploymentModel) =>
    deploymentModel(
      _.node('z1'),
      _.node('z1.s1'),
      _.node('z1.s2'),
      _.instanceOf('z1.s1.ui', 'cloud.ui'),
      _.instanceOf('z1.s1.api', 'cloud.backend.api'),
      _.instanceOf('z1.s2.ui', 'cloud.ui'),
      _.instanceOf('z1.s2.api', 'cloud.backend.api'),
    )
  )

  const { $include, $exclude } = TestHelper

  it('should identify cross-boundary relationships', () => {
    const t = TestHelper.from(deploymentModel)
    const state = t.processPredicates(
      $include('z1.s1.*'),
    )
    t.expect(state).toHaveElements(
      'z1.s1.ui',
      'z1.s1.api',
    )

    state.next($include('z1.s2.*'))
    t.expect(state).toHaveElements(
      'z1.s1.ui',
      'z1.s1.api',
      'z1.s2.ui',
      'z1.s2.api',
      'z1.s1',
      'z1.s2',
    )
    t.expect(state).toHaveConnections(
      'z1.s1.ui -> z1.s1.api',
      'z1.s2.ui -> z1.s2.api',
    )
  })

  it('should find cross-boundary when added node', () => {
    const t = TestHelper.from(deploymentModel)
    const state = t.processPredicates(
      $include('z1.s1'),
      $include('z1.s1.ui'),
      $include('z1.s2.api'),
    )
    t.expect(state).toHaveConnections({
      'z1.s1.ui -> z1.s2.api': {
        model: [
          'cloud.ui -> cloud.backend.api',
        ],
      },
    })

    t.expect(findCrossBoundaryConnections(state.memory.connections)).toBeEmpty()
    t.expect(findRedundantConnections(state.memory.connections)).toBeEmpty()

    // Include closer node
    state.next(
      $include('z1.s2.ui'),
    )
    t.expect(state).toHaveElements(
      'z1.s1',
      'z1.s1.ui',
      'z1.s2.api',
      'z1.s2.ui',
      'z1.s2',
    )
    t.expect(state).toHaveConnections(
      'z1.s2.ui -> z1.s2.api',
    )
  })

  it('should identify redundant connections', () => {
    const t = TestHelper.from(deploymentModel)
    const state = t.processPredicates(
      $include('z1.**'),
    )
    t.expect(state).toHaveElements(
      'z1.s1.ui',
      'z1.s1.api',
      'z1.s2.ui',
      'z1.s2.api',
      'z1.s1',
      'z1.s2',
    )
    t.expect(state).toHaveConnections(
      'z1.s1.ui -> z1.s1.api',
      'z1.s2.ui -> z1.s2.api',
    )

    state.next($exclude('-> z1.s2.api'))
    t.expect(state).toHaveElements(
      'z1.s1.ui',
      'z1.s1.api',
      'z1.s2.ui',
      'z1.s2.api',
      'z1.s2',
      'z1.s1',
    )
    t.expect(state).toHaveConnections(
      'z1.s1.ui -> z1.s1.api',
    )

    state.next($exclude('z1.s1.api'))
    t.expect(state).toHaveElements(
      'z1.s2.ui',
      'z1.s2.api',
    )
    t.expect(state.memory.connections).toBeEmpty()

    state.next($include('z1.s1.api'))
    t.expect(state).toHaveElements(
      'z1.s1.ui',
      'z1.s2.ui',
      'z1.s2.api',
      'z1.s1.api',
      'z1.s2',
      'z1.s1',
    )
    t.expect(state).toHaveConnections(
      'z1.s1.ui -> z1.s1.api',
    )
  })
})
