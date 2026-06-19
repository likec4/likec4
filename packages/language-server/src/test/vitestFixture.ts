import { type TestFunction, test as _test } from 'vitest'
import { createTestServices } from './testServices'

type TestServices = ReturnType<typeof createTestServices>

export const test = _test.extend<{
  t: TestServices
  create: (options?: Parameters<typeof createTestServices>[0]) => TestServices
}>({
  t: async ({}, use) => {
    using services = createTestServices()
    await use(services)
  },
  create: async ({}, use) => {
    const toDispose: Array<TestServices> = []
    await use((options) => {
      const services = createTestServices(options)
      toDispose.push(services)
      return services
    })
    toDispose.forEach(services => services[Symbol.dispose]())
  },
})

export const testFileScope = _test.extend<{
  $file: {
    /**
     * Test services shared across all tests in the same file
     * @internal
     * @use `t` fixture instead
     */
    tshared: TestServices
  }
  $test: {
    /**
     * Test services for the current test
     * Auto-cleaned up after each test
     */
    t: TestServices
  }
}>({
  tshared: [async ({}, use) => {
    using services = createTestServices()
    await use(services)
  }, { scope: 'file' }],
  t: async ({ tshared }, use) => {
    await use(tshared)
    await tshared.resetState()
  },
})
  .extend('validate', async ({ t }) => {
    return t.validate
  })
export type TestFileScope = typeof testFileScope
export type FileScopeTestFunction = TestFunction<{
  t: TestServices
  validate: TestServices['validate']
}>
