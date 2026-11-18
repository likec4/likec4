import { Builder } from '@likec4/core/builder'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, LayoutedView, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeComputedViewWithGroups, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
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

test('generate D2 - view with group', () => {
  const d2 = generateD2(mockViewModel(fakeComputedViewWithGroups))
  expect(d2).toMatchSnapshot()
  expect(d2).toContain('"@gr1": {')
  expect(d2).toContain('  "Auth": {')
  expect(d2).toContain('  "Portal": {')
  expect(d2).toContain('"App" -> "@gr1"."Auth": "signs in"')
})

test('generate D2 - element names that are D2 keywords, titles with ${}', () => {
  const m = Builder
    .specification({ elements: { component: {} } })
    .model(({ component, rel }, _) =>
      _(
        component('label', 'Label').with(
          component('icon', 'Cost ${price}'),
        ),
        component('top', 'Top'),
        rel('label.icon', 'top', { title: 'uses ${x}' }),
      )
    )
    .views(({ view, $include }) => view('index').with($include('*'), $include('label.*')))
    .toLikeC4Model()
  const d2 = generateD2(m.view('index'))
  expect(d2).toContain('"Label": {')
  expect(d2).toContain('"Icon": {')
  expect(d2).toContain('label: "Cost \\${price}"')
  expect(d2).toContain('"Label"."Icon" -> "Top": "uses \\${x}"')
})

test.each<{ id: 'Api' | 'API' }>([{ id: 'Api' }, { id: 'API' }])(
  'generate D2 - case-colliding ids remain distinct: $id',
  ({ id }) => {
    const m = Builder
      .specification({ elements: { component: {} } })
      .model(({ component, rel }, _) =>
        _(
          component('api', 'First'),
          component(id, 'Second'),
          rel('api', id),
        )
      )
      .views(({ view, $include }) => view('index').with($include('*')))
      .toLikeC4Model()
    const d2 = generateD2(m.view('index'))
    const namesByTitle = new Map(
      [...d2.matchAll(/^"([^"]+)": \{\n\s+label: "([^"]+)"/gm)].map(([, name, title]) => [title, name]),
    )
    expect(namesByTitle.size).toBe(2)
    expect(namesByTitle.get('First')?.toLowerCase()).not.toBe(namesByTitle.get('Second')?.toLowerCase())
    expect(d2).toContain(`"${namesByTitle.get('First')}" -> "${namesByTitle.get('Second')}"`)
  },
)

test('generate D2 - nested names avoid collisions within their own container', () => {
  const m = Builder
    .specification({ elements: { system: {}, component: {} } })
    .model(({ system, component, rel }, _) =>
      _(
        system('left').with(
          component('api', 'Lower'),
          component('API', 'Upper'),
          component('API2', 'Existing suffix'),
        ),
        system('right').with(component('api', 'Other container')),
        rel('left.api', 'left.API'),
        rel('left.API2', 'right.api'),
      )
    )
    .views(({ view, $include }) => view('index').with($include('*'), $include('left.*'), $include('right.*')))
    .toLikeC4Model()
  const d2 = generateD2(m.view('index'))
  const namesByTitle = new Map(
    [...d2.matchAll(/^\s*"([^"]+)": \{\n\s+label: "([^"]+)"/gm)].map(([, name, title]) => [title, name]),
  )
  const leftNames = ['Lower', 'Upper', 'Existing suffix'].map(title => namesByTitle.get(title)?.toLowerCase())
  expect(new Set(leftNames).size).toBe(3)
  expect(namesByTitle.get('Other container')).toBe('Api')
  expect(d2).toContain(`"Left"."${namesByTitle.get('Lower')}" -> "Left"."${namesByTitle.get('Upper')}"`)
  expect(d2).toContain(`"Left"."${namesByTitle.get('Existing suffix')}" -> "Right"."Api"`)
})
