import { LanguageServicesInstance } from '../../language-services'
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
  output: string
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined
}

export async function handler({ path, output: outputDir, ...params }: HandlerParams) {
  const languageServices = await LanguageServicesInstance.get({
    workspaceDir: path
  })

  const server = await vitePreview({ ...params, languageServices, outputDir, open: true })

  printServerUrls(server)
}
