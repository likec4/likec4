import { type TestFunction, test as _test } from 'vitest'
import { createTestServices } from './testServices'

type TestServices = ReturnType<typeof createTestServices>

export const testFileScope = _test
  .extend('create', ({}, { onCleanup }) => {
    const toDispose: Array<TestServices> = []

    onCleanup(async () => {
      await Promise.all(
        toDispose.map(services => services[Symbol.asyncDispose]()),
      )
    })

    return (options?: Parameters<typeof createTestServices>[0]) => {
      const services = createTestServices(options)
      toDispose.push(services)
      return services
    }
  })
  .extend('tshared', { scope: 'file' }, async ({}, { onCleanup }) => {
    const services = createTestServices()
    onCleanup(async () => {
      await services[Symbol.asyncDispose]()
    })
    await services.initialize()
    return services
  })
  .extend('t', ({ tshared }, { onCleanup }) => {
    onCleanup(async () => {
      await tshared.resetState()
    })
    return tshared
  })
  .extend('validate', ({ t }) => {
    return t.validate
  })

export const test = testFileScope

export type TestFileScope = typeof testFileScope
export type FileScopeTestFunction = TestFunction<{
  t: TestServices
  validate: TestServices['validate']
}>
