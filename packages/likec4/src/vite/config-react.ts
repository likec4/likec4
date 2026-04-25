import { LikeC4VitePlugin } from '@likec4/vite-plugin'
import k from 'tinyrainbow'
import type { InlineConfig } from 'vite'
import type { LikeC4 } from '../LikeC4'
import { createLikeC4Logger } from '../logger'
import { viteAliases } from './aliases'
import { JsBanners, relativeToCwd, viteAppRoot } from './utils'

type LikeC4ViteReactConfig = {
  languageServices: LikeC4
  outDir: string
  filename?: string
}

export async function viteReactConfig({
  languageServices,
  outDir,
  filename = 'likec4-react.mjs',
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
          'likec4/react',
          'likec4/model',
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          /@likec4\/core.*/,
        ],
      },
    },
    plugins: [
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
      }),
    ],
  }
}
