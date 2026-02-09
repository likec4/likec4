import { describe, expect, it } from 'vitest'
import {
  compareSemVer,
  findBestMatch,
  parseRange,
  parseSemVer,
  satisfies,
  semVerToString,
} from '../version'

describe('parseSemVer', () => {
  it('parses valid semver strings', () => {
    expect(parseSemVer('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    expect(parseSemVer('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 })
    expect(parseSemVer('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 })
  })

  it('parses prerelease versions', () => {
    expect(parseSemVer('1.0.0-alpha')).toEqual({ major: 1, minor: 0, patch: 0, prerelease: 'alpha' })
    expect(parseSemVer('1.0.0-beta.1')).toEqual({ major: 1, minor: 0, patch: 0, prerelease: 'beta.1' })
  })

  it('returns null for invalid strings', () => {
    expect(parseSemVer('')).toBeNull()
    expect(parseSemVer('abc')).toBeNull()
    expect(parseSemVer('1.2')).toBeNull()
    expect(parseSemVer('1.2.3.4')).toBeNull()
  })
})

describe('compareSemVer', () => {
  it('compares major versions', () => {
    expect(compareSemVer(parseSemVer('2.0.0')!, parseSemVer('1.0.0')!)).toBeGreaterThan(0)
    expect(compareSemVer(parseSemVer('1.0.0')!, parseSemVer('2.0.0')!)).toBeLessThan(0)
  })

  it('compares minor versions', () => {
    expect(compareSemVer(parseSemVer('1.2.0')!, parseSemVer('1.1.0')!)).toBeGreaterThan(0)
  })

  it('compares patch versions', () => {
    expect(compareSemVer(parseSemVer('1.0.2')!, parseSemVer('1.0.1')!)).toBeGreaterThan(0)
  })

  it('equal versions return 0', () => {
    expect(compareSemVer(parseSemVer('1.2.3')!, parseSemVer('1.2.3')!)).toBe(0)
  })

  it('prerelease has lower precedence than release', () => {
    expect(compareSemVer(parseSemVer('1.0.0-alpha')!, parseSemVer('1.0.0')!)).toBeLessThan(0)
    expect(compareSemVer(parseSemVer('1.0.0')!, parseSemVer('1.0.0-alpha')!)).toBeGreaterThan(0)
  })
})

describe('semVerToString', () => {
  it('converts without prerelease', () => {
    expect(semVerToString({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3')
  })

  it('converts with prerelease', () => {
    expect(semVerToString({ major: 1, minor: 0, patch: 0, prerelease: 'alpha' })).toBe('1.0.0-alpha')
  })
})

describe('parseRange', () => {
  it('parses exact ranges', () => {
    const range = parseRange('1.2.3')
    expect(range).toEqual({ type: 'exact', version: { major: 1, minor: 2, patch: 3 } })
  })

  it('parses caret ranges', () => {
    const range = parseRange('^1.2.3')
    expect(range).toEqual({ type: 'caret', version: { major: 1, minor: 2, patch: 3 } })
  })

  it('parses tilde ranges', () => {
    const range = parseRange('~1.2.3')
    expect(range).toEqual({ type: 'tilde', version: { major: 1, minor: 2, patch: 3 } })
  })

  it('returns null for invalid ranges', () => {
    expect(parseRange('')).toBeNull()
    expect(parseRange('^abc')).toBeNull()
  })
})

describe('satisfies', () => {
  describe('exact range', () => {
    it('matches exact version', () => {
      const range = parseRange('1.2.3')!
      expect(satisfies(parseSemVer('1.2.3')!, range)).toBe(true)
      expect(satisfies(parseSemVer('1.2.4')!, range)).toBe(false)
    })
  })

  describe('caret range', () => {
    it('^1.2.3 allows >=1.2.3 <2.0.0', () => {
      const range = parseRange('^1.2.3')!
      expect(satisfies(parseSemVer('1.2.3')!, range)).toBe(true)
      expect(satisfies(parseSemVer('1.3.0')!, range)).toBe(true)
      expect(satisfies(parseSemVer('1.9.9')!, range)).toBe(true)
      expect(satisfies(parseSemVer('2.0.0')!, range)).toBe(false)
      expect(satisfies(parseSemVer('1.2.2')!, range)).toBe(false)
    })

    it('^0.2.3 allows >=0.2.3 <0.3.0', () => {
      const range = parseRange('^0.2.3')!
      expect(satisfies(parseSemVer('0.2.3')!, range)).toBe(true)
      expect(satisfies(parseSemVer('0.2.9')!, range)).toBe(true)
      expect(satisfies(parseSemVer('0.3.0')!, range)).toBe(false)
    })

    it('^0.0.3 allows only 0.0.3', () => {
      const range = parseRange('^0.0.3')!
      expect(satisfies(parseSemVer('0.0.3')!, range)).toBe(true)
      expect(satisfies(parseSemVer('0.0.4')!, range)).toBe(false)
    })
  })

  describe('tilde range', () => {
    it('~1.2.3 allows >=1.2.3 <1.3.0', () => {
      const range = parseRange('~1.2.3')!
      expect(satisfies(parseSemVer('1.2.3')!, range)).toBe(true)
      expect(satisfies(parseSemVer('1.2.9')!, range)).toBe(true)
      expect(satisfies(parseSemVer('1.3.0')!, range)).toBe(false)
      expect(satisfies(parseSemVer('1.2.2')!, range)).toBe(false)
    })
  })
})

describe('findBestMatch', () => {
  const versions = [
    parseSemVer('1.0.0')!,
    parseSemVer('1.1.0')!,
    parseSemVer('1.2.0')!,
    parseSemVer('2.0.0')!,
  ]

  it('finds the highest matching version for caret range', () => {
    const best = findBestMatch(versions, parseRange('^1.0.0')!)
    expect(best).toEqual(parseSemVer('1.2.0'))
  })

  it('finds the highest matching version for tilde range', () => {
    const best = findBestMatch(versions, parseRange('~1.0.0')!)
    expect(best).toEqual(parseSemVer('1.0.0'))
  })

  it('returns null when no version matches', () => {
    const best = findBestMatch(versions, parseRange('^3.0.0')!)
    expect(best).toBeNull()
  })

  it('finds exact match', () => {
    const best = findBestMatch(versions, parseRange('2.0.0')!)
    expect(best).toEqual(parseSemVer('2.0.0'))
  })
})
