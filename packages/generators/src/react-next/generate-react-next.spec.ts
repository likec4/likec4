import { expect, test } from 'vitest'
import { fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateReactNext } from './generate-react-next'

test('generate react-next', () => {
  const {
    components,
    index,
    viewsData
  } = generateReactNext([fakeDiagram, fakeDiagram2])
  expect(index).toMatchSnapshot()
  expect(components).toMatchSnapshot()
  expect(viewsData).toMatchSnapshot()
})
