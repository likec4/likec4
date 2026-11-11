import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin'
import { reactDedupe, viteAliases } from './aliases'
import { relativeToCwd, viteAppRoot } from './utils'

type LikeC4ViteReactConfig = {
  languageServices: LikeC4
  outDir: string
  filename?: string
  /**
   * Absolute path to the file with UI customizations
   */
  customization?: string | undefined
}

export async function viteReactConfig({
  languageServices,
  outDir,
  filename = 'likec4-react.mjs',
  customization,
}: LikeC4ViteReactConfig): Promise<InlineConfig> {
  const customLogger = createLikeC4Logger(['vite', 'react'])
  const root = viteAppRoot()
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(relativeToCwd(root))}`)
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(relativeToCwd(outDir)))

  return {
    customLogger,
    root,
    configFile: false,
    clearScreen: false,
    publicDir: false,
    mode: 'production',
    resolve: {
      alias: viteAliases(),
      dedupe: reactDedupe,
    },
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      copyPublicDir: false,
      lib: {
        entry: 'codegen/react.mjs',
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
        languageServices: languageServices.languageServices,
        customization,
      }),
    ],
  }
}
