import { consola } from '@likec4/log'
import { beforeEach, vi } from 'vitest'
import { logger } from '../logger'
beforeEach(() => {
  // Vitest
  consola.mockTypes(() => vi.fn())
  logger.mockTypes(() => vi.fn())
})
