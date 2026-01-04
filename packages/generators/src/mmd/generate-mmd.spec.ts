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

test('generate mermaid - fakeDiagram', async ({ expect }) => {
  await expect(generateMermaid(mockViewModel(fakeDiagram))).toMatchFileSnapshot('__snapshots__/fakeDiagram.mmd.snap')
})

test('generate mermaid - fakeDiagram2', async ({ expect }) => {
  await expect(generateMermaid(mockViewModel(fakeDiagram2))).toMatchFileSnapshot('__snapshots__/fakeDiagram2.mmd.snap')
})

test('generate mermaid - fakeComputedView 3 Levels', async ({ expect }) => {
  await expect(generateMermaid(mockViewModel(fakeComputedView3Levels))).toMatchFileSnapshot(
    '__snapshots__/fakeComputedView3Levels.mmd.snap',
  )
})

test('generate mermaid - AllShapes', async ({ expect }) => {
  await expect(
    generateMermaid(mockViewModel(fakeComputedViewWithAllShapes)),
  ).toMatchFileSnapshot('__snapshots__/fakeComputedViewWithAllShapes.mmd.snap')
})
