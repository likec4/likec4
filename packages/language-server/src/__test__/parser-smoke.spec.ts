import { describe, vi, it } from 'vitest'
import '../logger'
vi.mock('../logger')

import { toPairs } from 'rambdax'
import { createTestServices } from '../test'
import * as testfiles from './parser-smoke'


describe.concurrent('parser smoke', () => {

  for (const [name, document] of toPairs(testfiles)) {
    it(name, async ({ expect }) => {
      const { validate } = createTestServices()
      const { diagnostics } = await validate(document)
      const errors = diagnostics.map(d => d.message).join('\n')
      if (name.startsWith('invalid_')) {
        expect(errors).not.toBe('')
      } else {
        expect(errors).toBe('')
      }
    })
  }

})
