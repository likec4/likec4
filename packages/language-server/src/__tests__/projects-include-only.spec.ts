import type { ProjectId } from '@likec4/core'
import { describe, it } from 'vitest'
import { URI } from 'vscode-uri'
import { createMultiProjectTestServices } from '../test'

/**
 * `wrapper` has no documents of its own, it only includes `../base`
 * (like `packages/likec4/src/cli/publish/__fixtures__/include-paths`).
 */
async function workspace() {
  const t = await createMultiProjectTestServices({})
  const folder = (name: string) => URI.parse(`file:///test/workspace/src/${name}`)
  await t.projectsManager.registerProject({ config: { name: 'base' }, folderUri: folder('base') })
  await t.projectsManager.registerProject({
    config: { name: 'wrapper', include: { paths: ['../base'] } },
    folderUri: folder('wrapper'),
  })
  await t.addDocument(
    'base/model.c4',
    `
    specification {
      element system
    }
    model {
      system sys
    }
    views {
      view index {
        include *
      }
    }
  `,
  )
  await t.validateAll()
  return t
}

describe('project with only included documents', () => {
  it('has the included documents', async ({ expect }) => {
    await using t = await workspace()
    const wrapper = t.services.likec4.LanguageServices.project('wrapper' as ProjectId)
    expect(wrapper.documents.map(uri => uri.path)).toEqual(['/test/workspace/src/base/model.c4'])
  })

  it('builds the model from the included documents', async ({ expect }) => {
    await using t = await workspace()
    const model = await t.buildLikeC4Model('wrapper')
    expect(model.element('sys')).toBeDefined()
  })

  it('is listed by LanguageServices.projects()', async ({ expect }) => {
    await using t = await workspace()
    const projects = t.services.likec4.LanguageServices.projects().map(p => p.id)
    expect(projects).toEqual(['base', 'wrapper'])
  })
})
