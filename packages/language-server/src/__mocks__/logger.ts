import { vi } from 'vitest'

export const logger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  silent: vi.fn()
}
export const logError = vi.fn()

export const logWarnError = vi.fn()
