import type { ProjectId } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { findProject } from './model-edits'

const projects = ['alpha', 'beta', 'gamma'] as ProjectId[]
const isIn = (...matching: string[]) => async (projectId: ProjectId) => matching.includes(projectId)

describe('findProject', () => {
  it('findProject — when one project matches then returns it', async () => {
    expect(await findProject(projects, 'Diff rfc1', isIn('beta'))).toEqual({ projectId: 'beta' })
  })

  it('findProject — when no project matches then reports it is not found', async () => {
    expect(await findProject(projects, 'Diff rfc1', isIn())).toEqual({ error: 'Diff rfc1 not found' })
  })

  it('findProject — when several projects match then asks for --project', async () => {
    expect(await findProject(projects, 'Element cloud.api', isIn('alpha', 'gamma'))).toEqual({
      error: 'Element cloud.api exists in projects alpha, gamma, select one with --project',
    })
  })
})
