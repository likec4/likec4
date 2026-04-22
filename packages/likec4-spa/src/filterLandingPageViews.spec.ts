import { describe, expect, it } from 'vitest'
import { filterLandingPageViews } from './filterLandingPageViews'

const mockView = (id: string, tags: string[] = []) =>
  ({
    id,
    tags,
  }) as any

describe('filterLandingPageViews', () => {
  const views = [
    mockView('landscape', ['public']),
    mockView('context', ['public']),
    mockView('internal', ['draft']),
    mockView('detail', []),
  ]

  it('returns all views when no filter', () => {
    expect(filterLandingPageViews(views, undefined)).toEqual(views)
  })

  it('includes by view ID', () => {
    const result = filterLandingPageViews(views, { include: ['landscape', 'context'] })
    expect(result.map(v => v.id)).toEqual(['landscape', 'context'])
  })

  it('includes by tag', () => {
    const result = filterLandingPageViews(views, { include: ['#public'] })
    expect(result.map(v => v.id)).toEqual(['landscape', 'context'])
  })

  it('includes mixed IDs and tags', () => {
    const result = filterLandingPageViews(views, { include: ['detail', '#public'] })
    expect(result.map(v => v.id)).toEqual(['landscape', 'context', 'detail'])
  })

  it('excludes by view ID', () => {
    const result = filterLandingPageViews(views, { exclude: ['internal'] })
    expect(result.map(v => v.id)).toEqual(['landscape', 'context', 'detail'])
  })

  it('excludes by tag', () => {
    const result = filterLandingPageViews(views, { exclude: ['#draft'] })
    expect(result.map(v => v.id)).toEqual(['landscape', 'context', 'detail'])
  })
})
