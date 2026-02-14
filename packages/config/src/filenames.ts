/** Trim trailing slashes and backslashes (no regex, avoids S5852 ReDoS). */
function trimTrailingSlashes(s: string): string {
  let end = s.length
  while (end > 0 && (s[end - 1] === '/' || s[end - 1] === '\\')) end--
  return s.slice(0, end)
}

/** Split by / or \ without regex (avoids S5852 ReDoS). */
function splitPath(s: string): string[] {
  return s.split('/').flatMap(part => part.split('\\'))
}

/** basename compatible with Node and browser (no node:path for Vite/playground bundle). */
function basename(path: string): string {
  const trimmed = trimTrailingSlashes(path)
  const segments = splitPath(trimmed)
  const last = segments[segments.length - 1]
  return last || trimmed
}

/** Known LikeC4 JSON config filenames (RC and .json). */
export const configJsonFilenames = [
  '.likec4rc',
  '.likec4.config.json',
  'likec4.config.json',
] as const

/** Known LikeC4 non-JSON config filenames (JS, MJS, TS, MTS). */
export const configNonJsonFilenames = [
  'likec4.config.js',
  'likec4.config.cjs',
  'likec4.config.mjs',
  'likec4.config.ts',
  'likec4.config.cts',
  'likec4.config.mts',
] as const

/** All known LikeC4 config filenames (JSON and non-JSON). */
export const ConfigFilenames = [
  ...configJsonFilenames,
  ...configNonJsonFilenames,
] as const

/** Returns true if the **basename** of the given path matches a known config filename. */
export function isLikeC4JsonConfig(filename: string): boolean {
  return (configJsonFilenames as readonly string[]).includes(basename(filename))
}

/**
 * Checks if the given filename is a LikeC4 non-JSON config file (JS, MJS, TS, MTS)
 */
export function isLikeC4NonJsonConfig(filename: string): filename is typeof configNonJsonFilenames[number] {
  return (configNonJsonFilenames as readonly string[]).includes(basename(filename))
}

/**
 * Checks if the given filename is a LikeC4 config file (JSON or non-JSON)
 */
export function isLikeC4Config(filename: string): filename is typeof ConfigFilenames[number] {
  return isLikeC4JsonConfig(filename) || isLikeC4NonJsonConfig(filename)
}
