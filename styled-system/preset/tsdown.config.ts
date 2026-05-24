import { defineConfig } from '@likec4/devops/tsdown'
import spawn from 'nano-spawn'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// const isDev = !isProduction

// const shared = {
//   clean: true,
//   env: {
//     NODE_ENV: isProduction ? 'production' : 'development',
//   },
//   minify: isProduction,
//   outputOptions: {
//     keepNames: true,
//   },
//   dts: false,
//   deps: {
//     neverBundle: ['vscode'],
//     alwaysBundle: [
//       /@likec4/,
//     ],
//   },
// }

export default defineConfig({
  entry: [
    'src/defaults/index.mts',
    'src/index.mts',
  ],
  unbundle: true,
  dts: true,
  platform: 'neutral',
  minify: false,
  hooks: {
    'build:prepare': async () => {
      console.log('build:prepare')
      await spawn('tsx', ['generate.ts'], {
        preferLocal: true,
        stdio: 'inherit',
      })
    },
  },
})

// export default defineConfig([
//   {
//     ...shared,
//     outDir: 'dist/node',
//     entry: 'src/node/extension.ts',
//     format: 'cjs',
//     nodeProtocol: true,
//     sourcemap: isDev,
//     inputOptions: {
//       resolve: {
//         conditionNames: ['sources', 'node', 'import', 'default'],
//       },
//     },
//     hooks: {
//       async 'build:done'() {
//         await copySchema()
//         await copySkills()
//         await copyPreview()
//       },
//     },
//   },
//   {
//     outDir: 'dist/node',
//     entry: [
//       'src/node/language-server.ts',
//       'src/node/mcp-server.ts',
//     ],
//     nodeProtocol: true,
//     format: 'esm',
//     sourcemap: isDev,
//     inputOptions: {
//       resolve: {
//         conditionNames: ['sources', 'node', 'import', 'default'],
//       },
//     },
//     ...shared,
//   },
//   {
//     outDir: 'dist/browser',
//     entry: 'src/browser/extension.ts',
//     format: 'cjs',
//     inputOptions: {
//       platform: 'browser',
//       resolve: {
//         conditionNames: ['production', 'sources', 'worker', 'browser', 'import'],
//       },
//     },
//     ...shared,
//     plugins: [
//       nodeModulesPolyfillPlugin(),
//     ],
//   },
//   {
//     outDir: 'dist/browser',
//     entry: 'src/browser/language-server-worker.ts',
//     format: 'iife',
//     inputOptions: {
//       resolve: {
//         conditionNames: ['worker', 'browser', 'import'],
//       },
//     },
//     ...shared,
//     plugins: [
//       nodeModulesPolyfillPlugin(),
//     ],
//   },
// ])

async function copySchema() {
  const schema = fileURLToPath(import.meta.resolve('@likec4/config/schema.json', import.meta.url))
  if (!existsSync(schema)) {
    throw new Error(`config schema not found: ${schema}`)
  }
  console.info('Copy config schema: %s', schema)
  await cp(schema, './data/config.schema.json')
}

function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }
  console.info('Cleaning: %s', dir)
  for (const file of readdirSync(dir)) {
    rmSync(resolve(dir, file), { recursive: true, force: true })
  }
}

async function copySkills() {
  const skillDir = resolve('../../skills/likec4-dsl')
  if (!existsSync(skillDir)) {
    throw new Error(`skills dir not found: ${skillDir}`)
  }
  console.info('Copy SKILLs: %s', skillDir)
  await cp(skillDir, './data/skills/likec4-dsl', { recursive: true })
}

async function copyPreview(): Promise<void> {
  const vscodePreview = resolve('../vscode-preview/dist/')
  if (!existsSync(vscodePreview)) {
    throw new Error(`vscode-preview dist not found: ${vscodePreview}`)
  }
  console.info('Copy vscode preview from %s', vscodePreview)

  emptyDir('dist/preview')
  await mkdir('dist/preview', { recursive: true })
  await cp(
    vscodePreview,
    'dist/preview',
    { recursive: true },
  )
}
