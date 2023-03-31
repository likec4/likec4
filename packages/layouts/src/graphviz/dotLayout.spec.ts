import { expect, test } from 'vitest'
import { fakeComputedView } from '../__mocks__/data'
import { dotLayout } from './dotLayout'

test('dotLayout', async () => {
  const diagram = await dotLayout(fakeComputedView)
  expect(diagram).toMatchSnapshot()
})
