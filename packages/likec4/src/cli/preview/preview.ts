import { fromWorkspace } from '@likec4/language-services/node'
import isInsideContainer from 'is-inside-container'
import k from 'tinyrainbow'
import { resolveAppConfig } from '../../app-config'
import { createLikeC4Logger } from '../../logger'
import { printServerUrls } from '../../vite/printServerUrls'
import { relativeToCwd } from '../../vite/utils'
import { vitePreview } from '../../vite/vite-preview'

type HandlerParams = {
  /**
   * `--app-config <file>` or `false` for `--no-app-config`
   */
  appConfig?: string | boolean | undefined
  /**
   * The directory where c4 files are located.
   * @default workspace from the app config, or the current directory
   */
  path?: string | undefined
  /**
   * Output directory of the production build
   * @default `build.outDir` from the app config, or `dist` in the workspace
   */
  output?: string | undefined
  /**
   * base url the app is being served from
   * @default `base` from the app config, or '/'
   */
  base?: string | undefined

  /**
   * ip address of the network interface to listen on
   * @default '127.0.0.1'
   */
  listen?: string | undefined
}

/**
 * Runs the LikeC4 preview server (static build) for the given workspace path.
 * The workspace, the output directory and the base url come from the app config, the same way `likec4 build` reads them.
 */
export async function handler({
  appConfig,
  path,
  output,
  base,
  listen,
}: HandlerParams) {
  const config = await resolveAppConfig({ appConfig, path, output, base })
  if (config.configFile) {
    createLikeC4Logger('c4:preview').info(`${k.cyan('app config')} ${k.dim(relativeToCwd(config.configFile))}`)
  }

  const languageServices = await fromWorkspace(config.workspace, {
    watch: false,
  })

  const server = await vitePreview({
    base: config.base,
    languageServices,
    outputDir: config.build.outDir,
    open: !isInsideContainer(),
    listen,
  })

  printServerUrls(server)
}
