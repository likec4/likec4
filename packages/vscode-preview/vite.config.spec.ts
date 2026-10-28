import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { build } from 'vite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import previewConfig from './vite.config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('preview build', () => {
  it.each([
    { mode: 'production', nodeEnv: 'development' },
    { mode: 'production', nodeEnv: 'production' },
    { mode: 'watch-dev', nodeEnv: 'development' },
    { mode: 'watch-dev', nodeEnv: 'production' },
    { mode: 'development', nodeEnv: 'production' },
  ])('runs the $mode bundle when launched with NODE_ENV=$nodeEnv', async ({ mode, nodeEnv }) => {
    vi.stubEnv('NODE_ENV', nodeEnv)
    if (typeof previewConfig !== 'function') {
      throw new Error('Expected a preview config factory')
    }
    const config = previewConfig({ command: 'build', mode })
    const entry = resolve(import.meta.dirname, 'vite.config.fixture.tsx')
    const result = await build({
      ...config,
      configFile: false,
      root: import.meta.dirname,
      logLevel: 'silent',
      plugins: [
        ...(config.plugins ?? []).filter(plugin =>
          !(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'ship-panda')
        ),
      ],
      build: {
        write: false,
        minify: false,
        lib: { entry, formats: ['cjs'] },
      },
    })
    const output = Array.isArray(result) ? result[0] : result
    if (!output || !('output' in output)) {
      throw new Error('Expected a single preview build output')
    }
    const chunk = output.output.find(output => output.type === 'chunk' && output.isEntry)
    if (!chunk || chunk.type !== 'chunk') {
      throw new Error('Expected a preview entry chunk')
    }
    const exported = {}
    runInNewContext(chunk.code, { module: { exports: exported }, exports: exported, console })
    expect(exported).toMatchObject({
      element: { type: 'div', props: { children: 'Preview ready' } },
    })
  })
})
