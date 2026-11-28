import type { LikeC4 } from '@likec4/language-services/node'
import type { InlineConfig } from 'vite'
import type { AppSource } from './app-source'
import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import k from 'tinyrainbow'
import { build, mergeConfig } from 'vite'
import { createViteLogger } from './logger'
import { relativeToCwd } from './utils'

export type BuildReactOptions = {
  app: AppSource
  likec4: LikeC4
  outDir: string
  /**
   * Name of the output file
   * @default 'likec4-react.mjs'
   */
  filename?: string
  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined
}

/**
 * Vite config of the React components (`likec4 gen react`), an ES module with external `likec4` and React
 */
export function reactViteConfig({
  app,
  likec4,
  outDir,
  filename = 'likec4-react.mjs',
  customization,
}: BuildReactOptions): InlineConfig {
  const customLogger = createViteLogger(['vite', 'react'])
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(relativeToCwd(app.root))}`)
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(relativeToCwd(outDir)))

  return mergeConfig(
    app.config,
    {
      customLogger,
      root: app.root,
      configFile: false,
      clearScreen: false,
      publicDir: false,
      mode: 'production',
      logLevel: 'warn',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      build: {
        outDir,
        emptyOutDir: false,
        sourcemap: false,
        minify: false,
        copyPublicDir: false,
        lib: {
          entry: app.entries.react,
          fileName(_format, _entryName) {
            return filename
          },
          formats: ['es'],
        },
        rolldownOptions: {
          external: [
            /^likec4(\/.*)?$/,
            /^react(\/.*)?$/,
            /^react-dom(\/.*)?$/,
          ],
        },
      },
      plugins: [
        LikeC4VitePlugin({
          ai: 'disabled',
          likec4,
          customization,
        }),
      ],
    } satisfies InlineConfig,
  ) as InlineConfig
}

/**
 * Builds the React components (`likec4 gen react`) into `outDir`
 */
export async function buildReact(options: BuildReactOptions): Promise<void> {
  await build(reactViteConfig(options))
}
