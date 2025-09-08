import packageJson from '@likec4/core/package.json'
import { consola } from 'consola'
import { generateDtsBundle } from 'dts-bundle-generator'
import { build, formatMessagesSync } from 'esbuild'
import { writeFile } from 'node:fs/promises'
import { isDevelopment, isProduction } from 'std-env'

try {
  const coreExports = Object
    .keys(packageJson.exports)
    .map((key) => `@likec4/core${key.slice(1)}`)
  consola.start('Bundle react')
  const { errors, warnings } = await build({
    entryPoints: [
      'react/index.ts',
    ],
    outfile: 'react/index.mjs',
    platform: 'browser',
    format: 'esm',
    color: true,
    bundle: true,
    treeShaking: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
    },
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      ...coreExports,
    ],
    minify: isProduction,
    minifyIdentifiers: false,
    minifySyntax: isProduction,
    minifyWhitespace: isProduction,
  })

  if (errors.length) {
    consola.error(formatMessagesSync(errors, {
      kind: 'error',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
  if (warnings.length) {
    consola.warn(formatMessagesSync(warnings, {
      kind: 'warning',
      color: true,
      terminalWidth: process.stdout.columns,
    }))
  }
  if (errors.length || warnings.length) {
    consola.error('⛔️ Build failed')
    process.exit(1)
  }
} catch (e) {
  consola.error('⛔️ Build failed')
  consola.error(e)
  process.exit(1)
}

consola.success('✅ React bundle done')
consola.start('generating dts bundle')

try {
  const [dts] = await generateDtsBundle([
    {
      filePath: './react/index.ts',
      libraries: {
        inlinedLibraries: [
          '@likec4/diagram/bundle',
          '@likec4/diagram',
          '@xyflow/react',
          '@xyflow/system',
          'type-fest',
        ],
      },
      output: {
        inlineDeclareGlobals: false,
        exportReferencedTypes: false,
      },
    },
  ], {
    preferredConfigPath: 'tsconfig.react-bundle.json',
  })

  if (!dts) {
    consola.error('⛔️ Failed to generate dts bundle')
    process.exit(1)
  }

  await writeFile('react/index.d.mts', dts, 'utf-8')
  consola.success('✅ React Typings done')
  process.exit(0)
} catch (e) {
  consola.error('⛔️ Failed to generate dts bundle')
  consola.error(e)
  process.exit(1)
}
