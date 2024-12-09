import { invariant } from '../errors'

/**
 * @see https://gist.github.com/victor-homyakov/bcb7d7911e4a388b1c810f8c3ce17bcf
 */
export function stringHash(str: string) {
  let hash = 5381
  const len = str.length
  invariant(len > 0, 'stringHash: empty string')

  for (let i = 0; i < len; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }

  return (hash >>> 0).toString(36)
}
