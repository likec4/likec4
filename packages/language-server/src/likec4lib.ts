import { type URI } from 'langium'
import { LibIcons } from './generated-lib/icons'

export const Scheme = 'likec4builtin'
export const Uri = `${Scheme}:///likec4/lib/icons.c4` as const

export { LibIcons as Content }

export function isLikeC4Builtin(uri: URI): boolean {
  return uri.scheme === Scheme
}
