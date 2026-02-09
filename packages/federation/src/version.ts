/**
 * Minimal semver parsing and range matching.
 * Supports exact, caret (^), and tilde (~) ranges.
 */

export interface SemVer {
  major: number
  minor: number
  patch: number
  prerelease?: string
}

export function parseSemVer(version: string): SemVer | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
  if (!match) return null
  const result: SemVer = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
  if (match[4] !== undefined) {
    result.prerelease = match[4]
  }
  return result
}

export function compareSemVer(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  // Pre-release versions have lower precedence
  if (a.prerelease && !b.prerelease) return -1
  if (!a.prerelease && b.prerelease) return 1
  if (a.prerelease && b.prerelease) {
    return a.prerelease < b.prerelease ? -1 : a.prerelease > b.prerelease ? 1 : 0
  }
  return 0
}

export function semVerToString(v: SemVer): string {
  const base = `${v.major}.${v.minor}.${v.patch}`
  return v.prerelease ? `${base}-${v.prerelease}` : base
}

export type SemVerRange =
  | { type: 'exact'; version: SemVer }
  | { type: 'caret'; version: SemVer }
  | { type: 'tilde'; version: SemVer }

export function parseRange(range: string): SemVerRange | null {
  const trimmed = range.trim()
  if (trimmed.startsWith('^')) {
    const version = parseSemVer(trimmed.slice(1))
    if (!version) return null
    return { type: 'caret', version }
  }
  if (trimmed.startsWith('~')) {
    const version = parseSemVer(trimmed.slice(1))
    if (!version) return null
    return { type: 'tilde', version }
  }
  const version = parseSemVer(trimmed)
  if (!version) return null
  return { type: 'exact', version }
}

export function satisfies(version: SemVer, range: SemVerRange): boolean {
  const cmp = compareSemVer(version, range.version)
  switch (range.type) {
    case 'exact':
      return cmp === 0
    case 'caret': {
      // ^1.2.3 := >=1.2.3 <2.0.0
      // ^0.2.3 := >=0.2.3 <0.3.0
      // ^0.0.3 := >=0.0.3 <0.0.4
      if (cmp < 0) return false
      if (range.version.major !== 0) {
        return version.major === range.version.major
      }
      if (range.version.minor !== 0) {
        return version.major === 0 && version.minor === range.version.minor
      }
      return version.major === 0 && version.minor === 0 && version.patch === range.version.patch
    }
    case 'tilde': {
      // ~1.2.3 := >=1.2.3 <1.3.0
      if (cmp < 0) return false
      return version.major === range.version.major && version.minor === range.version.minor
    }
  }
}

/**
 * Find the highest version that satisfies the given range
 */
export function findBestMatch(versions: SemVer[], range: SemVerRange): SemVer | null {
  let best: SemVer | null = null
  for (const v of versions) {
    if (satisfies(v, range)) {
      if (!best || compareSemVer(v, best) > 0) {
        best = v
      }
    }
  }
  return best
}
