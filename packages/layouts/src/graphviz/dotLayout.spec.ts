import { expect, test } from 'vitest'
import { fakeComputedView, fakeComputedView2} from '../__mocks__/data'
import { dotLayout } from './dotLayout'

test('dotLayout 1', async () => {
  const diagram = await dotLayout(fakeComputedView)
  expect(diagram).toMatchSnapshot()
})

test('dotLayout 2', async () => {
  const diagram = await dotLayout(fakeComputedView2)
  expect(diagram).toMatchSnapshot()
})
