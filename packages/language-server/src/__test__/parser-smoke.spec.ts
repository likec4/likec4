import { toPairs } from 'rambdax'
import { describe, vi, it } from 'vitest'
import { createTestServices } from '../test'
import * as testfiles from './parser-smoke'

vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

describe('parser smoke', () => {
  toPairs(testfiles).forEach(([name, document]) => {
    it.concurrent(name, async ({ expect }) => {
      const { validate } = createTestServices()
      const { diagnostics } = await validate(document)
      const errors = diagnostics.map(d => d.message)
      if (name.startsWith('invalid_')) {
        expect(errors).not.toEqual([])
      } else {
        expect(errors).toEqual([])
      }
    })
  })
})
