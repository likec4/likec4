import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { testServices } from '../test'
import * as testfiles from './parser-smoke'

test.each(D.toPairs(testfiles))('parser: %s', async (name, fixture) => {
  const { addDocument, validate } = testServices()
  addDocument(fixture, name)

  const errors = (await validate()).join('\n')
  if (name.startsWith('failing_')) {
    expect(errors).not.toEqual('')
  } else {
    expect(errors).toEqual('')
  }
  return
}, {
  timeout: 1000
})
