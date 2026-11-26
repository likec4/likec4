import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { $ } from 'zx'

/** Workspace with `likec4.app.config.ts` and `likec4.customization.tsx`, see e2e/fixtures/app-config */
const workspace = 'fixtures/app-config'
/** `build.outDir` of the app config, relative to the config file */
const configOutDir = resolve(workspace, 'dist')
const outDir = resolve('test-results/app-config')

/** Values set in `likec4.app.config.ts` */
const CONFIG_TITLE = 'E2E App Config'
const CONFIG_WEBCOMPONENT = 'e2e-view'
/** `data-testid` rendered by `likec4.customization.tsx` */
const CUSTOMIZATION_MARKER = 'custom-shape'

const TIMEOUT_BUILD = 60_000

function cleanDir(dir: string): string {
  rmSync(dir, { recursive: true, force: true })
  return dir
}

/** Source of all scripts of the built site */
function readScripts(siteDir: string): string {
  const files = [
    ...readdirSync(siteDir).map(name => join(siteDir, name)),
    ...readdirSync(join(siteDir, 'assets')).map(name => join(siteDir, 'assets', name)),
  ]
  return files
    .filter(file => file.endsWith('.js'))
    .map(file => readFileSync(file, 'utf8'))
    .join('\n')
}

test.concurrent(
  'LikeC4 CLI - build takes its options from the app config',
  { timeout: TIMEOUT_BUILD },
  async ({ expect }) => {
    cleanDir(configOutDir)

    await $`likec4 build ${workspace}`.quiet()

    expect(existsSync(join(configOutDir, 'index.html'))).toBe(true)
    const scripts = readScripts(configOutDir)
    expect(scripts).toContain(CONFIG_TITLE)
    expect(scripts).toContain(CUSTOMIZATION_MARKER)
    expect(readFileSync(join(configOutDir, 'likec4-views.js'), 'utf8')).toContain(CONFIG_WEBCOMPONENT)
  },
)

test.concurrent('LikeC4 CLI - build flags win over the app config', { timeout: TIMEOUT_BUILD }, async ({ expect }) => {
  const out = cleanDir(join(outDir, 'flags'))

  await $`likec4 build ${workspace} -o ${out} --title ${'From Flag'} --base /pages/ --webcomponent-prefix flag`.quiet()

  expect(readFileSync(join(out, 'index.html'), 'utf8')).toContain('/pages/assets/')
  const scripts = readScripts(out)
  expect(scripts).toContain('From Flag')
  expect(scripts).not.toContain(CONFIG_TITLE)
  // Not overridden by a flag, still comes from the config
  expect(scripts).toContain(CUSTOMIZATION_MARKER)
  expect(readFileSync(join(out, 'likec4-views.js'), 'utf8')).toContain('flag-view')
})

test.concurrent(
  'LikeC4 CLI - build --no-app-config ignores the app config',
  { timeout: TIMEOUT_BUILD },
  async ({ expect }) => {
    const out = cleanDir(join(outDir, 'no-app-config'))

    await $`likec4 build ${workspace} --no-app-config -o ${out}`.quiet()

    const scripts = readScripts(out)
    expect(scripts).not.toContain(CONFIG_TITLE)
    expect(scripts).not.toContain(CUSTOMIZATION_MARKER)
    expect(readFileSync(join(out, 'likec4-views.js'), 'utf8')).toContain('likec4-view')
  },
)

test.concurrent(
  'LikeC4 CLI - build fails on unknown options in the app config',
  { timeout: TIMEOUT_BUILD },
  async ({ expect }) => {
    const out = cleanDir(join(outDir, 'invalid'))

    const result = await $({
      nothrow: true,
    })`likec4 build ${workspace} --app-config ${join(workspace, 'invalid.app.config.mjs')} -o ${out}`.quiet()

    expect(result.exitCode).not.toBe(0)
    expect(result.stdout + result.stderr).toContain('unknownOption')
    expect(existsSync(join(out, 'index.html'))).toBe(false)
  },
)

test.concurrent(
  'LikeC4 CLI - codegen webcomponent takes the prefix and the customization from the app config',
  { timeout: TIMEOUT_BUILD },
  async ({ expect }) => {
    const outfile = join(cleanDir(join(outDir, 'webcomponent')), 'likec4-webcomponent.js')

    await $`likec4 codegen webcomponent ${workspace} -o ${outfile}`.quiet()

    const bundle = readFileSync(outfile, 'utf8')
    expect(bundle).toContain(CONFIG_WEBCOMPONENT)
    expect(bundle).toContain(CUSTOMIZATION_MARKER)
  },
)
