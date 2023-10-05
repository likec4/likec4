import { LanguageServicesInstance } from '@/language-services'
import { printServerUrls } from '@/vite/printServerUrls'
import { viteDev } from '@/vite/vite-dev'

type HandlerParams = {
  path: string
}

export async function handler({ path }: HandlerParams) {
  const languageServices = await LanguageServicesInstance.get({ workspaceDir: path })

  const server = await viteDev({ languageServices })

  printServerUrls(server)
}
