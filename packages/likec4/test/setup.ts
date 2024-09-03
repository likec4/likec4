import { logger } from '@likec4/log'
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  // Vitest
  logger.mockTypes(() => vi.fn())
})
