import type { View } from '@likec4/core'
import { invariant } from '@likec4/core'
import { hasAtLeast, unique, zip } from 'remeda'

function commonAncestorPath(views: View[], sep = '/') {
  if (views.length <= 1) return ''
  const uniqURIs = unique(views.flatMap(({ docUri }) => (docUri ? [docUri] : [])))
  if (uniqURIs.length === 0) return ''
  if (uniqURIs.length === 1) {
    invariant(hasAtLeast(uniqURIs, 1))
    return new URL(uniqURIs[0]).pathname
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

export function resolveRelativePaths(views: View[]): View[] {
  const commonPrefix = commonAncestorPath(views)
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
        const path = new URL(view.docUri).pathname
        const parts = path.replace(commonPrefix, '').split('/')
        parts.pop() // remove filename
        return {
          ...view,
          parts
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
        if (view.docUri) {
          return {
            ...view,
            relativePath: parts.join('/')
          }
        }
        return view
      })
  )
}
