import { LikeC4Styles } from '@likec4/core'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { expect, test, vi } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generatePuml } from './generate-puml'

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    $view,
    $model: {
      specification: {},
      $styles: LikeC4Styles.DEFAULT,
    },
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

test('generate puml - fakeDiagram', () => {
  expect(generatePuml(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate puml - fakeDiagram2', () => {
  expect(generatePuml(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate puml - fakeComputedView 3 Levels', () => {
  expect(generatePuml(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})
