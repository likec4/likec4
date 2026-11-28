import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fromWorkspace } from '@likec4/language-services/node'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { firstValidationError } from './validationError'

const spec = `
specification {
  element component
}
`

/**
 * Workspace with two projects:
 *   valid/   - project "valid"
 *   invalid/ - project "invalid", with a validation error
 */
function createWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'likec4-vite-validation-'))
  mkdirSync(join(root, 'valid'))
  writeFileSync(join(root, 'valid', 'likec4.config.json'), JSON.stringify({ name: 'valid' }))
  writeFileSync(join(root, 'valid', 'model.c4'), `${spec}\nmodel {\n  component a\n}\n`)
  mkdirSync(join(root, 'invalid'))
  writeFileSync(join(root, 'invalid', 'likec4.config.json'), JSON.stringify({ name: 'invalid' }))
  writeFileSync(join(root, 'invalid', 'model.c4'), `${spec}\nmodel {\n  component b\n  b -> unknown\n}\n`)
  return root
}

describe('firstValidationError', () => {
  let workspace: string

  beforeAll(() => {
    workspace = createWorkspace()
  })

  afterAll(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  it('ignores errors of projects excluded by includeProjects', async ({ expect }) => {
    await using likec4 = await fromWorkspace(workspace, { printErrors: false, includeProjects: 'valid' })
    expect(likec4.hasErrors()).toBe(true)
    expect(firstValidationError(likec4)).toBeNull()
  })

  it('reports errors of included projects', async ({ expect }) => {
    await using likec4 = await fromWorkspace(workspace, { printErrors: false, includeProjects: ['invalid', 'valid'] })
    const err = firstValidationError(likec4)
    expect(err).toMatchObject({
      name: 'LikeC4ValidationError',
      plugin: 'vite-plugin-likec4',
    })
    expect(err?.loc?.file).toMatch(/invalid[\\/]model\.c4$/)
  })

  it('reports errors of any project without includeProjects', async ({ expect }) => {
    await using likec4 = await fromWorkspace(workspace, { printErrors: false })
    const err = firstValidationError(likec4)
    expect(err?.loc?.file).toMatch(/invalid[\\/]model\.c4$/)
  })

  it('checks the whole workspace with language services only (deprecated option)', async ({ expect }) => {
    await using likec4 = await fromWorkspace(workspace, { printErrors: false, includeProjects: 'valid' })
    const err = firstValidationError(likec4.languageServices)
    expect(err?.loc?.file).toMatch(/invalid[\\/]model\.c4$/)
  })
})
