import { Builder } from '@likec4/core/builder'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, LayoutedView, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateDrawio } from './generate-drawio'

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

const mockViewModel = vi.fn(function ($view: ProcessedView<aux.Unknown>) {
  return {
    $view,
  } as unknown as LikeC4ViewModel<aux.Unknown, LayoutedView<aux.Unknown>>
})

/** Normalize variable output (e.g. date) for stable snapshots */
function normalizeDrawioXml(xml: string): string {
  return xml.replace(/modified="[^"]*"/, 'modified="FIXED-DATE"')
}

test('generate DrawIO - landscape', () => {
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
  expect(normalizeDrawioXml(generateDrawio(m.view('index')!))).toMatchSnapshot()
})

test('generate DrawIO - element view', () => {
  const m = b
    .views(({ viewOf, $include }) =>
      viewOf('v1', 'cloud').with(
        $include('*'),
      )
    )
    .toLikeC4Model()
  expect(normalizeDrawioXml(generateDrawio(m.view('v1')!))).toMatchSnapshot()
})

test('generate DrawIO - fakeDiagram', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeDiagram)))).toMatchSnapshot()
})

test('generate DrawIO - fakeDiagram2', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeDiagram2)))).toMatchSnapshot()
})

test('generate DrawIO - fakeComputedView 3 Levels', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeComputedView3Levels)))).toMatchSnapshot()
})
