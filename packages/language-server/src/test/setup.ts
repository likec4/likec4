import { consola } from '@likec4/log'
import { beforeAll, beforeEach, vi } from 'vitest'

beforeAll(() => {
  // Redirect std and console to consola too
  // Calling this once is sufficient
  consola.wrapAll()
})

beforeEach(() => {
  // Vitest
  consola.mockTypes(() => vi.fn())
})
