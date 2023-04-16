import { expect, test } from 'vitest'
import { fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateReact } from './generate-react'

test('generate react', () => {
  expect(generateReact([fakeDiagram, fakeDiagram2])).toMatchSnapshot()
})
