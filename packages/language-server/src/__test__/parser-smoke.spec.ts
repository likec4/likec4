import { toPairs } from 'rambdax'
import { expect, test } from 'vitest'
import { createTestServices } from '../test'
import * as testfiles from './parser-smoke'

test.concurrent.each(toPairs(testfiles))('parser: %s', async (name, document) => {
  const { validate } = createTestServices()
  const { diagnostics } = await validate(document)
  const errors = diagnostics.map(d => d.message)
  if (name.startsWith('invalid_')) {
    expect(errors).not.toEqual([])
  } else {
    expect(errors).toEqual([])
  }
}, {
  timeout: 1000
})
