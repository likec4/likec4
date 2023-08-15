import { vi } from 'vitest'
import type { Logger } from '../logger'

export const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  trace: vi.fn()
} satisfies Logger

export const logError = vi.fn()
export const logWarnError = vi.fn()
