export const configJsonFilenames = [
  '.likec4rc',
  '.likec4.config.json',
  'likec4.config.json',
] as const

export const configNonJsonFilenames = [
  'likec4.config.js',
  'likec4.config.cjs',
  'likec4.config.mjs',
  'likec4.config.ts',
  'likec4.config.cts',
  'likec4.config.mts',
] as const

export const ConfigFilenames = [
  ...configJsonFilenames,
  ...configNonJsonFilenames,
] as const

/**
 * Checks if the given filename is a LikeC4 JSON config file (JSON, RC).
 */
export function isLikeC4JsonConfig(filename: string): filename is typeof configJsonFilenames[number] {
  for (const ext of configJsonFilenames) {
    if (filename.endsWith(ext)) {
      return true
    }
  }
  return false
}

/**
 * Checks if the given filename is a LikeC4 non-JSON config file (JS, MJS, TS, MTS)
 */
export function isLikeC4NonJsonConfig(filename: string): filename is typeof configNonJsonFilenames[number] {
  for (const ext of configNonJsonFilenames) {
    if (filename.endsWith(ext)) {
      return true
    }
  }
  return false
}

/**
 * Checks if the given filename is a LikeC4 config file (JSON or non-JSON)
 */
export function isLikeC4Config(filename: string): filename is typeof ConfigFilenames[number] {
  return isLikeC4JsonConfig(filename) || isLikeC4NonJsonConfig(filename)
}
