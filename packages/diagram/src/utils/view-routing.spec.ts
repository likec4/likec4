import { expect, it } from 'vitest'
import { viewRouting } from './view-routing'

it('defaults the view routing to spline', () => {
  expect(viewRouting({})).toBe('spline')
  expect(viewRouting({ routing: 'ortho' })).toBe('ortho')
})
