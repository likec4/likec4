import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import isInsideContainer from 'is-inside-container'
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
  listen,
}: HandlerParams) {
  const languageServices = await fromWorkspace(path, {
    watch: false,
  })

  const server = await vitePreview({
    base,
    languageServices,
    outputDir,
    open: !isInsideContainer(),
    listen,
  })

  printServerUrls(server)
}
