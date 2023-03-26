import { D } from '@mobily/ts-belt'
import { expect, test } from 'vitest'
import { expectError, validationHelper, expectFunction } from 'langium/test'
import { createTestLanguageServices, testServices } from '../test'

expectFunction((actual, expected, message) => {
  expect(actual, message).toEqual(expected)
})

const services = createTestLanguageServices()
const validate = validationHelper(services)


test.skip('elementChecks', async () => {
  const result = await validate(`
    specification {
      element component
    }
    model {
      component c1
      component c1
    }
  `)
  expectError(result, "Duplicate element kind 'component'", {} as any)
})
