import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { test, vi } from 'vitest'
import {
  fakeComputedView3Levels,
  fakeComputedViewWithAllShapes,
  fakeComputedViewWithGroups,
  fakeDiagram,
  fakeDiagram2,
} from '../__mocks__/data'
import { generateMermaid } from './generate-mmd'

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    titleOrId: $view.title || $view.id,
    $view,
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

test('generate mermaid - fakeDiagram', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate mermaid - fakeDiagram2', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate mermaid - fakeComputedView 3 Levels', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})

test('generate mermaid - AllShapes', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeComputedViewWithAllShapes))).toMatchSnapshot()
})

test('generate mermaid - view with group', ({ expect }) => {
  const mmd = generateMermaid(mockViewModel(fakeComputedViewWithGroups))
  expect(mmd).toMatchSnapshot()
  expect(mmd).not.toContain('@gr1')
  expect(mmd).toContain('subgraph _gr1["`Infra`"]')
  expect(mmd).toContain('_gr1.Auth@{ shape: rectangle, label: "Auth" }')
  expect(mmd).toContain('_gr1.Portal@{ shape: rectangle, label: "Portal" }')
  expect(mmd).toContain('App -. "`signs in`" .-> _gr1.Auth')
})
