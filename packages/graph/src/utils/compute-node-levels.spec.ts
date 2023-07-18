import { describe, expect, it } from 'vitest'
import { fakeModel } from '../__test__'
import type { Fqn, ViewID } from '../types'
import { computeElementView } from '../compute-view/compute-element-view'
import { computeNodeLevels } from './compute-node-levels'

describe('compute-node-levels', () => {
  it('view of cloud', () => {
    const view = computeElementView(
      {
        id: 'cloud' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              {
                wildcard: true
              }
            ]
          }
        ]
      },
      fakeModel()
    )
    const levels = computeNodeLevels(view)

    expect(levels).toStrictEqual({
      customer: {
        depth: 0,
        level: 0
      },
      support: {
        depth: 0,
        level: 0
      },
      cloud: {
        depth: 1,
        level: 0
      },
      'cloud.frontend': {
        depth: 0,
        level: 1
      },
      'cloud.backend': {
        depth: 0,
        level: 1
      },
      amazon: {
        depth: 0,
        level: 0
      }
    })
  })

  it('view with 3 levels', () => {
    const view = computeElementView(
      {
        id: 'cloud3levels' as ViewID,
        title: '',
        viewOf: 'cloud' as Fqn,
        rules: [
          {
            isInclude: true,
            exprs: [
              // include *
              { wildcard: true },
              // include cloud.frontend.*
              { element: 'cloud.frontend' as Fqn, isDescedants: true },
              // include cloud.backend.*
              { element: 'cloud.backend' as Fqn, isDescedants: true }
            ]
          }
        ]
      },
      fakeModel()
    )

    const levels = computeNodeLevels(view)

    expect(levels).toStrictEqual({
      amazon: {
        depth: 0,
        level: 0
      },
      cloud: {
        depth: 2,
        level: 0
      },
      'cloud.backend': {
        depth: 1,
        level: 1
      },
      'cloud.backend.graphql': {
        depth: 0,
        level: 2
      },
      'cloud.backend.storage': {
        depth: 0,
        level: 2
      },
      'cloud.frontend': {
        depth: 1,
        level: 1
      },
      'cloud.frontend.adminPanel': {
        depth: 0,
        level: 2
      },
      'cloud.frontend.dashboard': {
        depth: 0,
        level: 2
      },
      customer: {
        depth: 0,
        level: 0
      },
      support: {
        depth: 0,
        level: 0
      }
    })
  })
})
