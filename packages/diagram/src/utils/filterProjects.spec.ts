import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { filterProjects, projectSearchHighlights } from './filterProjects'

const projects = [
  { id: 'team-a' as ProjectId, title: 'Real Estate Pro', path: 'architecture/re-pro' },
  { id: 'team-b' as ProjectId, title: 'Import jobs', path: 'architecture/import-re-job' },
  { id: 'mim-trx' as ProjectId },
]

const ids = (query: string) => filterProjects(projects, query).map(p => p.id)

describe('filterProjects', () => {
  it('returns every project for an empty query', () => {
    expect(ids('  ')).toEqual(['team-a', 'team-b', 'mim-trx'])
    expect(ids('*')).toEqual(['team-a', 'team-b', 'mim-trx'])
  })

  it('matches id, title and path, ignoring case', () => {
    expect(ids('MIM')).toEqual(['mim-trx'])
    expect(ids('estate')).toEqual(['team-a'])
    expect(ids('import-re')).toEqual(['team-b'])
  })

  it('requires every term', () => {
    expect(ids('team re')).toEqual(['team-a', 'team-b'])
    expect(ids('team pro')).toEqual(['team-a'])
  })

  it('supports * wildcards and literal regexp characters', () => {
    expect(ids('re-*job')).toEqual(['team-b'])
    expect(ids('m*x')).toEqual(['mim-trx'])
    expect(ids('team.a')).toEqual([])
  })

  it('extracts highlights', () => {
    expect(projectSearchHighlights('Re-* pro')).toEqual(['re-', 'pro'])
  })
})
