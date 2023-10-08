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
}

export async function handler({ path, output: outputDir }: HandlerParams) {
  const languageServices = await LanguageServicesInstance.get({
    workspaceDir: path
  })

  const server = await vitePreview({ languageServices, outputDir, open: true })

  printServerUrls(server)
}
