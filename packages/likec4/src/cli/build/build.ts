import { LanguageServicesInstance } from '@/language-services'
import { viteBuild } from '@/vite/vite-build'

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
  const languageServices = await LanguageServicesInstance.get({ workspaceDir: path })

  await viteBuild({ languageServices, outputDir })
}
