import type { LikeC4, LikeC4LanguageServices } from '@likec4/language-services'
import type { ErrorPayload } from 'vite'
import { splitErrorMessage } from './rpc/sendError'

/**
 * Returns the first validation error of the projects the plugin works with, as a Vite error payload,
 * or `null` if there are no errors.
 *
 * If the instance is limited with `includeProjects`, errors in documents of other projects are ignored:
 * they must not block hot reload of the included projects.
 * Without an instance (deprecated `languageServices` option), checks the whole workspace.
 */
export function firstValidationError(
  source: LikeC4 | LikeC4LanguageServices,
): ErrorPayload['err'] | null {
  const errors = 'languageServices' in source ? source.getErrors({ scope: 'included' }) : source.getErrors()
  const [error] = errors
  if (!error) {
    return null
  }
  return {
    name: 'LikeC4ValidationError',
    ...splitErrorMessage(error.message),
    plugin: 'vite-plugin-likec4',
    loc: {
      file: error.sourceFsPath,
      line: error.line,
      column: error.range.start.character + 1,
    },
  }
}
