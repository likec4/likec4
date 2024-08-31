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
}

export async function handler({
  path,
  output: outputDir,
  base
}: HandlerParams) {
  const languageServices = await LikeC4.initForWorkspace(path, {
    logger: 'vite'
  })

  const server = await vitePreview({ base, languageServices, outputDir, open: true })

  printServerUrls(server)
}
