import { expect, test } from 'vitest'
import {
  computedAmazonView,
  computedCloudView,
  computedCloud3levels,
  computedIndexView
} from '../__mocks__/data'
import { printToDot } from './printToDot'

test('printToDot: computedIndexView', () => {
  const diagram = printToDot(computedIndexView)
  expect(diagram).toMatchSnapshot()
})

test('printToDot: computedAmazonView', () => {
  const diagram = printToDot(computedAmazonView)
  expect(diagram).toMatchSnapshot()
})

test('printToDot: computedCloud3levels', () => {
  const diagram = printToDot(computedCloud3levels)
  expect(diagram).toMatchSnapshot()
})

test('printToDot: computedCloudView', () => {
  const diagram = printToDot(computedCloudView)
  expect(diagram).toMatchSnapshot()
})
