import { resolve } from 'node:path'
import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * Do not validate layout of views
   */
  ignoreLayout: boolean
}

export async function handler({
  path,
  ignoreLayout,
}: HandlerParams): Promise<number> {
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
  })
  const viewsLogger = createLikeC4Logger('c4:views')
  let valid = true
  valid = await validateModel(languageServices) && valid
  valid = (ignoreLayout || await validateLayout(languageServices, viewsLogger)) && valid

  return valid ? 0 : exit(1)

  function validateModel(languageServices: LikeC4): boolean {
    const errors = languageServices.getErrors()
    if (errors.length === 0) {
      return true
    }

    return false
  }

  async function validateLayout(
    languageServices: LikeC4,
    logger: ReturnType<typeof createLikeC4Logger>,
  ): Promise<boolean> {
    const views = await languageServices.diagrams()
    let hasLayoutDrift = false

    for (const view of views) {
      if (view.hasLayoutDrift === true) {
        hasLayoutDrift = true
        logger.error(
          k.red(`Layout drift detected on view '${view.id}' at ${resolve(path, view.relativePath ?? '.')}`),
        )
      }
    }

    if (!hasLayoutDrift) {
      return true
    }

    return false
  }
}
