import { expect, test } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generatePuml } from './generate-puml'

test('generate puml - fakeDiagram', () => {
  expect(generatePuml(fakeDiagram)).toMatchSnapshot()
})

test('generate puml - fakeDiagram2', () => {
  expect(generatePuml(fakeDiagram2)).toMatchSnapshot()
})

test('generate puml - fakeComputedView 3 Levels', () => {
  expect(generatePuml(fakeComputedView3Levels)).toMatchSnapshot()
})
