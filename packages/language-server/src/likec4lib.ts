import type { URI } from 'vscode-uri'
import { LibIcons } from './generated-lib/icons'

export const Scheme = 'likec4builtin'
export const Uri = `${Scheme}:///likec4/lib/icons.c4` as const

export { LibIcons as Content }

export function isLikeC4Builtin(uri: URI | { uri: URI }): boolean {
  const u = 'uri' in uri ? uri.uri : uri
  return u.scheme === Scheme
}

export function isNotLikeC4Builtin(uri: URI | { uri: URI }): boolean {
  return !isLikeC4Builtin(uri)
}
