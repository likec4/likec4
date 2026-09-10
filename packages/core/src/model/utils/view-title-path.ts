import { hasAtLeast } from 'remeda'
import type { NonEmptyArray } from '../../types'
import { invariant } from '../../utils'

export const VIEW_FOLDERS_SEPARATOR = '/'

// A '/' preceded by a backslash is an escaped, literal slash (see docs on organizing views)
// and must not be treated as a folder separator.
const UNESCAPED_SEPARATOR = /(?<!\\)\//
const ESCAPED_SEPARATOR = /\\\//g

/**
 * Converts an escaped `\/` (produced by the parser to protect a literal slash from being
 * treated as a folder separator) back into a plain `/` for display.
 */
export const unescapeViewPathSegment = (segment: string): string => segment.replace(ESCAPED_SEPARATOR, '/')

/**
 * Splits a title/path into segments, honoring `\/` as an escaped (non-splitting) slash.
 * Segments keep any `\/` markers intact - callers that display a segment must unescape it.
 */
const splitViewTitle = (title: string): NonEmptyArray<string> => {
  invariant(!title.includes('\n'), 'View title cannot contain newlines')
  if (UNESCAPED_SEPARATOR.test(title)) {
    const segments = title
      .split(UNESCAPED_SEPARATOR)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    if (hasAtLeast(segments, 1)) {
      return segments
    }
    return ['']
  }
  return [title.trim()]
}

/**
 * Splits an already-normalized path string back into its segments, honoring escaped slashes.
 * Use this instead of a plain `String.split` whenever re-splitting a path produced by
 * {@link normalizeViewPath} or {@link getViewFolderPath}.
 */
export const splitViewFolderPath = (path: string): NonEmptyArray<string> => splitViewTitle(path)

/**
 * Normalizes view path by removing spaces from segments, removing empty segments,
 * and removing leading/trailing slashes
 * @example
 * normalizeViewPath('One / Tw o / Thre e') === 'One/Tw o/Thre e'
 */
export const normalizeViewPath = (title: string): string => {
  return splitViewTitle(title).join(VIEW_FOLDERS_SEPARATOR)
}

/**
 * Returns view group path if it is used as a path
 * Returns empty string if it is not a path
 * @example
 * getViewFolderPath('One / Tw o / Thre e') === 'One/Tw o'
 * getViewFolderPath('One') === ''
 */
export const getViewFolderPath = (title: string): string | null => {
  const segments = splitViewTitle(title)
  if (!hasAtLeast(segments, 2)) {
    return null
  }
  return segments.slice(0, -1).join(VIEW_FOLDERS_SEPARATOR)
}

/**
 * Returns view title if it is used as a path
 * @example
 * getViewTitleFromPath('One / Tw o / Thre e') === 'Thre e'
 * getViewTitleFromPath('One') === 'One'
 */
export const extractViewTitleFromPath = (title: string): string => {
  if (!UNESCAPED_SEPARATOR.test(title)) {
    return unescapeViewPathSegment(title.trim())
  }
  return unescapeViewPathSegment(splitViewTitle(title).at(-1) ?? title)
}
