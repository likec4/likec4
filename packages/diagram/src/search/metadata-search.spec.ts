import { describe, expect, it } from 'vitest'
import { matchesMetadataSearch, metadataSearchQuery } from './metadata-search'

describe('metadata search', () => {
  const metadata = {
    platform: 'browser',
    team: ['Team1', 'team2'],
    notes: 'line one\nline two',
  }

  it('builds queries', () => {
    expect(metadataSearchQuery('platform')).toBe('meta:platform')
    expect(metadataSearchQuery('platform', 'browser')).toBe('meta:platform=browser')
  })

  it('matches by key (partial)', () => {
    expect(matchesMetadataSearch(metadata, 'meta:plat')).toBe(true)
    expect(matchesMetadataSearch(metadata, 'meta:owner')).toBe(false)
  })

  it('matches by exact key and partial value, case-insensitive', () => {
    expect(matchesMetadataSearch(metadata, 'meta:platform=browser')).toBe(true)
    expect(matchesMetadataSearch(metadata, 'meta:plat=browser')).toBe(false)
    expect(matchesMetadataSearch(metadata, 'meta:team=team1')).toBe(true)
    expect(matchesMetadataSearch(metadata, 'meta:notes=line two')).toBe(true)
    expect(matchesMetadataSearch(metadata, 'meta:platform=mobile')).toBe(false)
  })

  it('bare prefix matches any element with metadata', () => {
    expect(matchesMetadataSearch(metadata, 'meta:')).toBe(true)
    expect(matchesMetadataSearch({}, 'meta:')).toBe(false)
  })
})
