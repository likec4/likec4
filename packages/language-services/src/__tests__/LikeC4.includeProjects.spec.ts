import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { fromWorkspace } from '../node/index'

const spec = `
specification {
  element component
}
`

/**
 * Workspace with two projects and a source outside of both:
 *   alpha/  - project "alpha"
 *   beta/   - project "beta"
 *   orphan.c4
 */
function createWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'likec4-include-projects-'))
  for (const name of ['alpha', 'beta']) {
    mkdirSync(join(root, name))
    writeFileSync(join(root, name, 'likec4.config.json'), JSON.stringify({ name }))
    writeFileSync(
      join(root, name, 'model.c4'),
      `${spec}
model {
  component ${name}
}
`,
    )
  }
  // no specification, it comes from the project that owns this file
  writeFileSync(
    join(root, 'orphan.c4'),
    `
model {
  component orphan
}
`,
  )
  return root
}

describe('LikeC4 includeProjects', () => {
  let workspace: string

  beforeAll(() => {
    workspace = createWorkspace()
  })

  afterAll(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  const open = (includeProjects?: string | string[]) =>
    fromWorkspace(workspace, { printErrors: false, includeProjects })

  it('without includeProjects, requires an exact project', async ({ expect }) => {
    await using likec4 = await open()
    expect(likec4.projects()).toEqual(expect.arrayContaining(['alpha', 'beta']))
    expect(() => likec4.ensureProjectId()).toThrow(/Specify exact project/)
  })

  it('with a single project, uses it by default', async ({ expect }) => {
    await using likec4 = await open('alpha')
    expect(likec4.projects()).toEqual(['alpha'])
    expect(likec4.ensureProjectId()).toBe('alpha')
    expect(() => likec4.ensureProjectId('beta')).toThrow(/is not included/)
    expect(() => likec4.ensureSingleProject()).not.toThrow()

    const model = await likec4.computedModel()
    expect(model.projectId).toBe('alpha')
    expect(model.findElement('alpha')).not.toBeNull()
    expect(model.findElement('beta')).toBeNull()
  })

  it('with a single project, it owns sources outside of every project', async ({ expect }) => {
    await using likec4 = await open('alpha')
    const model = await likec4.computedModel()
    expect(model.findElement('orphan')).not.toBeNull()
  })

  it('with several projects, sources outside of every project stay in default', async ({ expect }) => {
    await using likec4 = await open(['alpha', 'beta'])
    const model = await likec4.computedModel('alpha')
    expect(model.findElement('orphan')).toBeNull()
  })

  it('with several projects, requires an exact project', async ({ expect }) => {
    await using likec4 = await open(['beta', 'alpha'])
    expect(likec4.projects()).toEqual(['beta', 'alpha'])
    expect(() => likec4.ensureProjectId()).toThrow(/Specify exact project, included: \[beta, alpha\]/)
    expect(() => likec4.ensureSingleProject()).toThrow(/Multiple projects/)

    const model = await likec4.computedModel('beta')
    expect(model.findElement('beta')).not.toBeNull()
    expect(model.findElement('alpha')).toBeNull()
  })

  it('fails on unknown projects', async ({ expect }) => {
    await expect(open(['alpha', 'gamma'])).rejects.toThrow(/Unknown projects in includeProjects: \[gamma\]/)
  })

  it('fails on empty list', async ({ expect }) => {
    await expect(open([])).rejects.toThrow(/must not be empty/)
  })
})
