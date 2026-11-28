import { beforeEach, vi } from 'vitest'

// Specs run with `--no-isolate` and share the module cache. CLI commands load language services
// through the shared `src/cli/utils.ts`, which would keep the `fromWorkspace` mock of the first
// spec file that imported it. Reset the cache, so every spec file loads modules with its own mocks.
vi.resetModules()

// Fresh dependencies of CLI commands for each test, so `vi.spyOn(useCli(), ...)` never leaks.
// Imported here (after the reset above) to get the same module instance as the spec file.
beforeEach(async () => {
  const { createCliContext, setCliContext } = await import('./src/cli/context')
  setCliContext(createCliContext())
})
