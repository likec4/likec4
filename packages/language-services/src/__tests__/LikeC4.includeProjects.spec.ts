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

  it('fails on the default project next to named projects', async ({ expect }) => {
    await expect(open('default')).rejects.toThrow(/must name a project instead of "default", known: \[alpha, beta\]/)
  })

  it('accepts the default project when there are no other projects', async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), 'likec4-include-default-'))
    try {
      writeFileSync(join(root, 'model.c4'), `${spec}\nmodel {\n  component solo\n}\n`)
      await using likec4 = await fromWorkspace(root, { printErrors: false, includeProjects: 'default' })
      const model = await likec4.computedModel()
      expect(model.findElement('solo')).not.toBeNull()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

/**
 * Workspace with two projects, beta has a validation error:
 *   alpha/  - project "alpha", includes ../shared
 *   beta/   - project "beta", with an error
 *   shared/ - included by alpha
 */
function createWorkspaceWithErrors(sharedSource: string): string {
  const root = mkdtempSync(join(tmpdir(), 'likec4-include-projects-errors-'))
  mkdirSync(join(root, 'alpha'))
  writeFileSync(
    join(root, 'alpha', 'likec4.config.json'),
    JSON.stringify({ name: 'alpha', include: { paths: ['../shared'] } }),
  )
  writeFileSync(join(root, 'alpha', 'model.c4'), `${spec}\nmodel {\n  component alpha\n}\n`)
  mkdirSync(join(root, 'beta'))
  writeFileSync(join(root, 'beta', 'likec4.config.json'), JSON.stringify({ name: 'beta' }))
  writeFileSync(join(root, 'beta', 'model.c4'), `${spec}\nmodel {\n  component beta\n  beta -> unknown\n}\n`)
  mkdirSync(join(root, 'shared'))
  writeFileSync(join(root, 'shared', 'shared.c4'), sharedSource)
  return root
}

describe('LikeC4 includeProjects diagnostics', () => {
  const validShared = `model {\n  component shared\n}\n`
  const invalidShared = `model {\n  component shared\n  shared -> missing\n}\n`

  it('scope "included" ignores errors of excluded projects', async ({ expect }) => {
    const root = createWorkspaceWithErrors(validShared)
    try {
      await using likec4 = await fromWorkspace(root, { printErrors: false, includeProjects: 'alpha' })
      const betaErrors = likec4.getErrors().filter(e => e.sourceFsPath.includes('beta'))
      expect(betaErrors).not.toEqual([])
      expect(likec4.hasErrors()).toBe(true)

      expect(likec4.getErrors({ scope: 'included' })).toEqual([])
      expect(likec4.hasErrors({ scope: 'included' })).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('scope "included" reports errors of included projects', async ({ expect }) => {
    const root = createWorkspaceWithErrors(validShared)
    try {
      await using likec4 = await fromWorkspace(root, { printErrors: false, includeProjects: 'beta' })
      const errors = likec4.getErrors({ scope: 'included' })
      expect(errors).not.toEqual([])
      expect(errors.every(e => e.sourceFsPath.includes('beta'))).toBe(true)
      expect(likec4.hasErrors({ scope: 'included' })).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('scope "included" reports errors in files included by the project', async ({ expect }) => {
    const root = createWorkspaceWithErrors(invalidShared)
    try {
      await using likec4 = await fromWorkspace(root, { printErrors: false, includeProjects: 'alpha' })
      const errors = likec4.getErrors({ scope: 'included' })
      expect(errors).not.toEqual([])
      expect(errors.every(e => e.sourceFsPath.includes('shared'))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('scope "included" checks the whole workspace without includeProjects', async ({ expect }) => {
    const root = createWorkspaceWithErrors(validShared)
    try {
      await using likec4 = await fromWorkspace(root, { printErrors: false })
      expect(likec4.getErrors({ scope: 'included' })).toEqual(likec4.getErrors())
      expect(likec4.hasErrors({ scope: 'included' })).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
