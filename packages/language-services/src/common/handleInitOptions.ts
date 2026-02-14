import { type Logger, rootLogger } from '@likec4/log'
import defu from 'defu'
import { type LikeC4Langium, LikeC4 } from './LikeC4'
import type { InitOptions } from './options'

const validationErrorsToError = (likec4: LikeC4) =>
  new Error(
    `Invalid model:\n${
      likec4.getErrors().map(e => `  ${e.sourceFsPath}:${e.line} ${e.message.slice(0, 200)}`).join('\n')
    }`,
  )

export async function handleInitOptions(
  langium: LikeC4Langium,
  logger: Logger = rootLogger,
  options: InitOptions | undefined,
): Promise<LikeC4> {
  const likec4 = new LikeC4(langium, logger)

  const opts = defu(options, {
    printErrors: true,
    throwIfInvalid: false,
  })

  if (opts.throwIfInvalid === true && likec4.hasErrors()) {
    await likec4.dispose()
    return Promise.reject(validationErrorsToError(likec4))
  }

  if (opts.printErrors !== false && likec4.hasErrors()) {
    likec4.printErrors()
  }

  return likec4
}
