import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeComputedViewWithAllShapes, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
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
