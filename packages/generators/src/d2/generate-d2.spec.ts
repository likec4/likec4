import { expect, test } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateD2 } from './generate-d2'

test('generate D2 - fakeDiagram', () => {
  expect(generateD2(fakeDiagram)).toMatchSnapshot()
})

test('generate D2 - fakeDiagram2', () => {
  expect(generateD2(fakeDiagram2)).toMatchSnapshot()
})

test('generate D2 - fakeComputedView 3 Levels', () => {
  expect(generateD2(fakeComputedView3Levels)).toMatchSnapshot()
})
