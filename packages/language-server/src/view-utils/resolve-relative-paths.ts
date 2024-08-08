import type { LikeC4View } from '@likec4/core'
import { invariant } from '@likec4/core'
import { filter, hasAtLeast, isTruthy, map, pipe, unique, zip } from 'remeda'

function commonAncestorPath(views: LikeC4View[], sep = '/') {
  const uniqURIs = pipe(
    views,
    map(v => v.docUri),
    filter(isTruthy),
    unique()
  )
  if (uniqURIs.length === 0) return ''
  if (hasAtLeast(uniqURIs, 1) && uniqURIs.length === 1) {
    const parts = new URL(uniqURIs[0]).pathname.split(sep)
    if (parts.length <= 1) return sep
    parts.pop() // remove filename
    return parts.join(sep) + sep
  }
  invariant(hasAtLeast(uniqURIs, 2), 'Expected at least 2 unique URIs')
  const [baseUri, ...tail] = uniqURIs
  const parts = new URL(baseUri).pathname.split(sep)
  let endOfPrefix = parts.length
  for (const uri of tail) {
    if (uri === baseUri) {
      continue
    }
    const compare = new URL(uri).pathname.split(sep)
    for (let i = 0; i < endOfPrefix; i++) {
      if (compare[i] !== parts[i]) {
        endOfPrefix = i
      }
    }
    if (endOfPrefix === 0) return ''
  }
  const prefix = parts.slice(0, endOfPrefix).join(sep)
  return prefix.endsWith(sep) ? prefix : prefix + sep
}

export function resolveRelativePaths(views: LikeC4View[]): LikeC4View[] {
  const sep = '/'
  const commonPrefix = commonAncestorPath(views, sep)
  return (
    views
      // For each view, compute the relative path to the common prefix
      // Store array of path segments
      .map(view => {
        if (!view.docUri) {
          return {
            ...view,
            parts: []
          }
        }
        let path = new URL(view.docUri).pathname
        if (commonPrefix.length > 0) {
          invariant(
            path.startsWith(commonPrefix),
            `Expect path "${path}" to start with common prefix: "${commonPrefix}"`
          )
          path = path.slice(commonPrefix.length)
        } else {
          path = path.includes(sep) ? path.slice(path.lastIndexOf(sep) + 1) : path
        }
        return {
          ...view,
          parts: path.split(sep)
        }
      })
      // Sort views by path segments
      .sort((a, b) => {
        if (a.parts.length === b.parts.length) {
          if (a.parts.length === 0) {
            return 0
          }
          if (a.parts.length === 1 && hasAtLeast(a.parts, 1) && hasAtLeast(b.parts, 1)) {
            return a.parts[0].localeCompare(b.parts[0])
          }
          for (const [_a, _b] of zip(a.parts, b.parts)) {
            const compare = _a.localeCompare(_b)
            if (compare !== 0) {
              return compare
            }
          }
          return 0
        }
        return a.parts.length - b.parts.length
      })
      // Build relativePath from path segments
      .map(({ parts, ...view }) => {
        return {
          ...view,
          relativePath: parts.join(sep)
        }
      })
  )
}
