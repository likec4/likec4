import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { createTestServices } from '../test'
import * as testfiles from './parser-smoke'

test.each(D.toPairs(testfiles))('parser: %s', async (name, fixture) => {
  const { parse, validateAll } = createTestServices()
  await parse(fixture, name)

  const errors = await validateAll().then(e => e.join('\n'))
  if (name.startsWith('failing_')) {
    expect(errors).not.toEqual('')
  } else {
    expect(errors).toEqual('')
  }
}, {
  timeout: 1000
})
