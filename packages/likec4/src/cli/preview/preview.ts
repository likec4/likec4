import { LikeC4 } from '../../LikeC4'
import { printServerUrls } from '../../vite/printServerUrls'
import { vitePreview } from '../../vite/vite-preview'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output?: string | undefined
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined

  /**
   * ip address of the network interface to listen on
   * @default '127.0.0.1'
   */
  listen?: string | undefined
}

export async function handler({
  path,
  output: outputDir,
  base,
  listen
}: HandlerParams) {
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite'
  })

  const server = await vitePreview({ base, languageServices, outputDir, open: true, listen })

  printServerUrls(server)
}
