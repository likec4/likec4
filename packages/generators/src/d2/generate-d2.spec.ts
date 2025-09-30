import { Builder } from '@likec4/core/builder'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, LayoutedView, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateD2 } from './generate-d2'

const b = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
      component: {},
    },
    deployments: {
      env: {},
      vm: {},
    },
    tags: {
      t1: {},
    },
  })
  .model(({ actor, system, component, rel }, _) =>
    _(
      actor('alice', 'Alice'),
      actor('bob', 'Bob'),
      system('cloud', 'Cloud').with(
        component('backend', 'Backend').with(
          component('api', 'API'),
          component('db', 'DB'),
        ),
        component('frontend'),
      ),
      rel('alice', 'cloud.frontend', {
        title: 'uses \n at home',
      }),
      rel('bob', 'cloud.frontend', {
        title: 'uses \n at work',
      }),
      rel('cloud.backend.api', 'cloud.backend.db'),
      rel('cloud.frontend', 'cloud.backend.api', {
        title: 'requests',
        tags: ['t1'],
      }),
    )
  )
// Test Element View

test('generate D2 - landscape', () => {
  const m = b
    .views(({ view, $include }) =>
      view('index', {
        title: 'Layout',
        description: 'description',
      }).with(
        $include('*'),
      )
    )
    .toLikeC4Model()
  expect(generateD2(m.view('index'))).toMatchSnapshot()
})

test('generate D2 - element view', () => {
  const m = b
    .views(({ viewOf, $include }) =>
      viewOf('v1', 'cloud').with(
        $include('*'),
      )
    )
    .toLikeC4Model()
  expect(generateD2(m.view('v1'))).toMatchSnapshot()
})

test('generate D2 - element view 3 levels', () => {
  const m = b
    .views(({ viewOf, $include }) =>
      viewOf('v2', 'cloud.backend').with(
        $include('*'),
        $include('* -> cloud._'),
      )
    )
    .toLikeC4Model()
  expect(generateD2(m.view('v2'))).toMatchSnapshot()
})

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    $view,
  } as unknown as LikeC4ViewModel<aux.Unknown, LayoutedView<aux.Unknown>>
})

test('generate D2 - fakeDiagram', () => {
  expect(generateD2(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate D2 - fakeDiagram2', () => {
  expect(generateD2(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate D2 - fakeComputedView 3 Levels', () => {
  expect(generateD2(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})
