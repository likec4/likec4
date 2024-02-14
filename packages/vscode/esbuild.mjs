import * as esbuild from 'esbuild'
import { build, formatMessagesSync } from 'esbuild'
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill'
import { writeFileSync } from 'node:fs'

import path, { resolve } from 'node:path'

const watch = process.argv.includes('--watch')
const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod'
console.log(`VSCode build isDev=${isDev}`)

/**
 * @type {esbuild.BuildOptions}
 */
const base = {
  metafile: isDev,
  logLevel: 'info',
  outdir: 'dist',
  outbase: 'src',
  color: true,
  bundle: true,
  external: ['vscode'],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  sourcemap: true,
  sourcesContent: isDev,
  keepNames: true,
  minify: !isDev,
  legalComments: 'none'
}

/**
 * @type {esbuild.BuildOptions}
 */
const extensionNodeCfg = {
  ...base,
  entryPoints: ['src/node/extension.ts'],
  format: 'cjs',
  target: 'node16',
  platform: 'node'
}
const serverNodeCfg = {
  ...extensionNodeCfg,
  entryPoints: ['src/node/language-server.ts']
}

/**
 * @type {esbuild.BuildOptions}
 */
const extensionWebCfg = {
  ...base,
  entryPoints: ['src/browser/extension.ts'],
  format: 'cjs',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()]
}
/**
 * @type {esbuild.BuildOptions}
 */
const serverWebCfg = {
  ...base,
  entryPoints: ['src/browser/language-server-worker.ts'],
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  plugins: [nodeModulesPolyfillPlugin()]
}

const builds = [extensionNodeCfg, serverNodeCfg, extensionWebCfg, serverWebCfg]

let hasErrors = false
const bundles = await Promise.all(builds.map(cfg => Promise.resolve().then(() => build(cfg))))
bundles.forEach(({ errors, warnings, metafile }) => {
  if (metafile) {
    esbuild.analyzeMetafileSync(metafile)
    const out = Object.keys(metafile.outputs).find(k => k.endsWith('.js'))
    if (out) {
      const metafilepath = path.resolve(out + '.metafile.json')
      writeFileSync(metafilepath, JSON.stringify(metafile))
      console.debug(metafilepath)
    }
  }
  if (errors.length) {
    hasErrors = true
    console.error(formatMessagesSync(errors, {
      kind: 'error',
      color: true,
      terminalWidth: process.stdout.columns
    }))
  }
  if (warnings.length) {
    console.warn(formatMessagesSync(warnings, {
      kind: 'warning',
      color: true,
      terminalWidth: process.stdout.columns
    }))
  }
})

if (hasErrors) {
  console.error('⛔️ Build failed')
  process.exit(1)
}

// if (!watch) {
//   const bundles = await Promise.all([
//     esbuild.build(extensionNodeCfg),
//     esbuild.build(extensionWebCfg),
//     esbuild.build(webWorkerCfg)
//   ])

//   const [nodeBundle, webBundle, webWorkerBundle] = bundles
//   nodeBundle.outputFiles

//   if (nodeBundle.metafile) {
//     const metafile = path.resolve('dist', 'node', 'extension.metafile.json')
//     await writeFile(metafile, JSON.stringify(nodeBundle.metafile))
//   }
//   if (webBundle.metafile) {
//     const metafile = path.resolve('dist', 'browser', 'extension.metafile.json')
//     await writeFile(metafile, JSON.stringify(webBundle.metafile))
//   }
//   if (webWorkerBundle.metafile) {
//     const metafile = path.resolve('dist', 'browser', 'language-server-worker.metafile.json')
//     await writeFile(metafile, JSON.stringify(webBundle.metafile))
//   }

//   const errors = bundles.flatMap(b => b.errors)
//   const warnings = bundles.flatMap(b => b.warnings)
//   if (errors.length || warnings.length) {
//     console.error(
//       [
//         ...formatMessagesSync(warnings, {
//           kind: 'warning',
//           color: true,
//           terminalWidth: process.stdout.columns
//         }),
//         ...formatMessagesSync(errors, {
//           kind: 'error',
//           color: true,
//           terminalWidth: process.stdout.columns
//         })
//       ].join('\n')
//     )
//     console.error('\n ⛔️ Build failed')
//     process.exit(1)
//   }
//   process.exit(0)
// }

// const [nodeCtx, webCtx, webWorkerCtx] = await Promise.all([
//   esbuild.context(extensionNodeCfg),
//   esbuild.context(extensionWebCfg),
//   esbuild.context(webWorkerCfg)
// ])
// await nodeCtx.watch()
// await webCtx.watch()
// await webWorkerCtx.watch()
// console.info(' 👀 watching...')
