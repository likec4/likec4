import { compareNaturalHierarchically } from '@likec4/core/utils'
import { withoutTrailingSlash } from 'ufo'
import type { URI } from 'vscode-uri'

const compare = compareNaturalHierarchically('/')
/**
 * Compare two URIs by their path
 * (natural hierarchical comparison)
 *
 * @example
 * const withUri = [
 *   { uri: URI.file('/b/c') },
 *   { uri: URI.file('/b') },
 *   { uri: URI.file('/a/b/c') },
 * ]
 * withUri.sort(compareByUri).map(x => x.uri.path)
 * // [
 * //   '/a/b/c',
 * //   '/b',
 * //   '/b/c',
 * // ]
 */
export const compareByUri = (a: { uri: URI }, b: { uri: URI }) =>
  compare(
    withoutTrailingSlash(a.uri.path),
    withoutTrailingSlash(b.uri.path),
  )

const compareDeepFirst = compareNaturalHierarchically('/', true)

/**
 * Compare two URIs by their path
 * (natural hierarchical comparison, deep first)
 *
 * @example
 * const withUri = [
 *   { uri: URI.file('/b/c') },
 *   { uri: URI.file('/b') },
 *   { uri: URI.file('/a/b/c') },
 * ]
 * withUri.sort(compareByUriDeepFirst).map(x => x.uri.path)
 * // [
 * //   '/b/c',
 * //   '/b',
 * //   '/a/b/c',
 * // ]
 */
export const compareByUriDeepFirst = (a: { uri: URI }, b: { uri: URI }) =>
  compareDeepFirst(
    withoutTrailingSlash(a.uri.path),
    withoutTrailingSlash(b.uri.path),
  )
