import { expect, test } from 'vitest'
import { printToDot } from './printToDot'
import { fakeComputedView } from '../__mocks__/data'

test('printToDot fake diagram', () => {
  const dot = printToDot(fakeComputedView)
  expect(dot).toMatchSnapshot()

//   const graphviz = await Graphviz.load();

//   const svg = graphviz.dot(dot, 'json');
// // await writeFile('test.svg', svg)
//   console.log(svg)
// //   // graphviz.
})
