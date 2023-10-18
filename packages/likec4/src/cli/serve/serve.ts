import { LanguageServicesInstance } from '@/language-services'
import { printServerUrls } from '@/vite/printServerUrls'
import { viteDev } from '@/vite/vite-dev'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined
}

export async function handler({ path, ...params }: HandlerParams) {
  const languageServices = await LanguageServicesInstance.get({ workspaceDir: path })

  const server = await viteDev({ ...params, languageServices })

  printServerUrls(server)
}
