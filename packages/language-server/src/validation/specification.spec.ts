import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { expectError, validationHelper, expectFunction } from 'langium/test'
import { createTestLanguageServices, testServices } from '../test'

expectFunction((actual, expected, message) => {
  expect(actual, message).toEqual(expected)
})

const services = createTestLanguageServices()
const validate = validationHelper(services)


test('elementKindChecks', async () => {
  const result = await validate(`
    specification {
      element component
      element user
      element component
    }
  `)
  expectError(result, "Duplicate element kind 'component'", {} as any)
})
