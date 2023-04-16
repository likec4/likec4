import { expect, test } from 'vitest'
import {
  computedAmazonView,
  computedCloudView,
  computedCloud3levels,
  computedIndexView
} from '../__mocks__/data'
import { dotLayout } from './dotLayout'

test('dotLayout: computedIndexView', async () => {
  const diagram = await dotLayout(computedIndexView)
  expect(diagram).toMatchSnapshot()
})

test('dotLayout: computedAmazonView', async () => {
  const diagram = await dotLayout(computedAmazonView)
  expect(diagram).toMatchSnapshot()
})

test('dotLayout: computedCloud3levels', async () => {
  const diagram = await dotLayout(computedCloud3levels)
  expect(diagram).toMatchSnapshot()
})

test('dotLayout: computedCloudView', async () => {
  const diagram = await dotLayout(computedCloudView)
  expect(diagram).toMatchSnapshot()
})
