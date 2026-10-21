import { type TestFunction, test as _test } from 'vitest'
import { createTestServices } from './testServices'

type TestServices = ReturnType<typeof createTestServices>

/**
 * Vitest stores fixture values on the test context and keeps test tasks (with their context)
 * alive for the whole worker. With `isolate: false` this retains every language services instance
 * and the worker eventually runs out of memory, so we drop the fixture values after teardown.
 */
function releaseFixtureValues(context: object, keep: ReadonlySet<string>) {
  for (const key of Object.keys(context)) {
    if (!keep.has(key)) {
      Reflect.deleteProperty(context, key)
    }
  }
}

export const test = _test.extend<{
  t: TestServices
  create: (options?: Parameters<typeof createTestServices>[0]) => TestServices
}>({
  t: async ({ task }, use) => {
    // Keys present before `t` resolves (built-ins and unrelated fixtures);
    // `t` and the fixtures derived from it are added later and released after teardown
    const keep = new Set(Object.keys(task.context))
    const services = createTestServices()
    try {
      await use(services)
    } finally {
      await services[Symbol.asyncDispose]()
      releaseFixtureValues(task.context, keep)
    }
  },
  create: async ({ task: _task }, use) => {
    const toDispose: Array<TestServices> = []
    await use((options) => {
      const services = createTestServices(options)
      toDispose.push(services)
      return services
    })
    await Promise.all(toDispose.map(services => services[Symbol.asyncDispose]()))
    toDispose.length = 0
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
  // Vitest requires a destructuring pattern here, and a file-scoped fixture has no dependencies
  // oxlint-disable-next-line no-empty-pattern
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
