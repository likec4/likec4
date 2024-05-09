import consola from 'consola'
import { build, type BuildOptions, formatMessagesSync } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { writeFile } from 'node:fs/promises'

export async function buildCli(isDev = false) {
  consola.start(`Building CLI...`)

  const cfg: BuildOptions = {
    metafile: isDev,
    logLevel: 'info',
    outdir: 'dist',
    outbase: 'src',
    outExtension: {
      '.js': '.mjs'
    },
    color: true,
    bundle: true,
    sourcemap: isDev,
    sourcesContent: isDev,
    keepNames: isDev,
    minify: !isDev,
    treeShaking: !isDev,
    legalComments: 'none',
    mainFields: ['module', 'main'],
    entryPoints: ['src/cli/index.ts'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    format: 'esm',
    target: 'node18',
    platform: 'node',
    alias: {
      '@/vite/config-app': '@/vite/config-app.prod',
      '@/vite/config-react': '@/vite/config-react.prod',
      '@/vite/config-webcomponent': '@/vite/config-webcomponent.prod'
    },
    banner: {
      js: 'import { createRequire as crReq } from \'module\'; const require = crReq(import.meta.url);'
    },
    plugins: [
      nodeExternalsPlugin({
        dependencies: true,
        optionalDependencies: true,
        devDependencies: false
      })
    ]
  }

  const bundle = await build(cfg)
  if (bundle.errors.length || bundle.warnings.length) {
    console.error(
      [
        ...formatMessagesSync(bundle.warnings, {
          kind: 'warning',
          color: true,
          terminalWidth: process.stdout.columns
        }),
        ...formatMessagesSync(bundle.errors, {
          kind: 'error',
          color: true,
          terminalWidth: process.stdout.columns
        })
      ].join('\n')
    )
    console.error('\n ⛔️ Build failed')
    process.exit(1)
  }
  if (bundle.metafile) {
    await writeFile('dist/cli/metafile.json', JSON.stringify(bundle.metafile))
  }
}
