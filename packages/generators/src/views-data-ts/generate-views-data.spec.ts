import { expect, test } from 'vitest'
import { fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateViewsDataTs } from './generate-views-data'

test('generate generateViewsDataTs', () => {
  expect(generateViewsDataTs([
    fakeDiagram,
    fakeDiagram2
  ])).toMatchSnapshot()
})
