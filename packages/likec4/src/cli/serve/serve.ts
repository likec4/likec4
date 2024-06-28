import { LanguageServices } from '@/language-services'
import { viteDev } from '@/vite/vite-dev'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined

  useHashHistory: boolean | undefined

  webcomponentPrefix: string
}

export async function handler({
  path,
  useDotBin,
  webcomponentPrefix,
  useHashHistory,
  base
}: HandlerParams) {
  const languageServices = await LanguageServices.get({ path, useDotBin })

  await viteDev({
    buildWebcomponent: false,
    hmr: true,
    base,
    webcomponentPrefix,
    languageServices,
    useHashHistory
  })
}
