import { LanguageServices } from '@/language-services'
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

  useDotBin: boolean

  useHashHistory: boolean | undefined

  webcomponentPrefix: string
}

export async function buildHandler({
  path,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
  output: outputDir,
  base
}: HandlerParams) {
  const languageServices = await LanguageServices.get({ path, useDotBin })
  await viteBuild({
    base,
    useHashHistory,
    webcomponentPrefix,
    languageServices,
    outputDir
  })
}
