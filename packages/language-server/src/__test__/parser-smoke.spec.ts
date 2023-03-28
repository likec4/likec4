import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { createTestServices } from '../test'
import * as testfiles from './parser-smoke'

test.each(D.toPairs(testfiles))('parser: %s', async (name, fixture) => {
  const { parse, validateAll } = createTestServices()
  await parse(fixture, name)

  const { errorMessages } = await validateAll()
  if (name.startsWith('invalid_')) {
    expect(errorMessages).not.toEqual('')
  } else {
    expect(errorMessages).toEqual('')
  }
}, {
  timeout: 1000
})
