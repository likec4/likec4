import { expect, test } from 'vitest'
import { fakeDiagram, fakeDiagram2 } from './__mocks__/data'
import { generate } from './generate'

test('generate react', () => {
  const diagram = generate([
    fakeDiagram,
    fakeDiagram2
  ])
  expect(diagram).toMatchSnapshot()
})
