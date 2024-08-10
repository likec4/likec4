import { beforeAll, beforeEach, vi } from 'vitest'
import { logger } from '../logger'

beforeAll(() => {
  // Redirect std and console to consola too
  // Calling this once is sufficient
  logger.wrapAll()
})

beforeEach(() => {
  // Vitest
  logger.mockTypes(() => vi.fn())
})
