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
  output?: string | undefined
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined
}

export async function handler({ path, output: outputDir, ...params }: HandlerParams) {
  const languageServices = await LanguageServicesInstance.get({ workspaceDir: path })
  await viteBuild({ ...params, languageServices, outputDir })
}
