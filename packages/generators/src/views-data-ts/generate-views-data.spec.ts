import { expect, test } from 'vitest'
import { fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateViewsDataDTs, generateViewsDataJs, generateViewsDataTs } from './generate-views-data'

test('generate generateViewsDataJs', () => {
  expect(generateViewsDataJs([fakeDiagram, fakeDiagram2])).toMatchSnapshot()
})

test('generate generateViewsDataTs', () => {
  expect(generateViewsDataTs([fakeDiagram, fakeDiagram2])).toMatchSnapshot()
})

test('generate generateViewsDataDTs', () => {
  expect(generateViewsDataDTs([fakeDiagram, fakeDiagram2])).toMatchSnapshot()
})
