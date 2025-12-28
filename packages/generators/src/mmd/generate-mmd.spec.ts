import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2, fakeShapesView } from '../__mocks__/data'
import { generateMermaid } from './generate-mmd'

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    $view,
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

test('generate mermaid - fakeDiagram', () => {
  expect(generateMermaid(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate mermaid - fakeDiagram2', () => {
  expect(generateMermaid(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate mermaid - fakeComputedView 3 Levels', () => {
  expect(generateMermaid(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})

test('generate mermaid - document and bucket shapes', () => {
  expect(generateMermaid(mockViewModel(fakeShapesView))).toMatchSnapshot()
})
