import type { Fqn, ProjectId } from '@likec4/core'
import { URI } from 'langium'
import { describe, it } from 'vitest'
import { createMultiProjectTestServices } from '../../test'

const spec = `
  specification {
    element component
  }
`

async function workspace(
  projects: Record<string, { name: string; dependencies?: Record<string, string>; model: string }>,
) {
  const t = await createMultiProjectTestServices({})
  for (const [folder, { name, dependencies, model }] of Object.entries(projects)) {
    await t.projectsManager.registerProject({
      config: {
        name,
        ...(dependencies && { dependencies }),
      },
      folderUri: URI.parse(`file:///test/workspace/src/${folder}`),
    })
    await t.addDocument(`${folder}/model.c4`, model)
  }
  await t.validateAll()
  return t
}

const consumerModel = `
  import { svc } from 'billing'
  ${spec}
  model {
    component c
    c -> svc
  }
`

describe('LikeC4ModelLocator -- dependencies', () => {
  it('locates element imported under a dependency name', async ({ expect }) => {
    await using t = await workspace({
      'shared-folder': { name: 'shared', model: `${spec} model { component svc }` },
      'consumer': { name: 'consumer', dependencies: { billing: '../shared-folder' }, model: consumerModel },
    })
    const locator = t.services.likec4.ModelLocator
    const location = locator.locateElement('@billing.svc' as Fqn, 'consumer' as ProjectId)
    expect(location?.uri).toBe('file:///test/workspace/src/shared-folder/model.c4')
    // unknown import name
    expect(locator.locateElement('@payments.svc' as Fqn, 'consumer' as ProjectId)).toBeNull()
  })

  it('locates element in the project of the dependencies entry, not in the same-named project', async ({ expect }) => {
    await using t = await workspace({
      'billing': { name: 'billing', model: `${spec} model { component svc }` },
      'shared-folder': { name: 'shared', model: `${spec} model { component svc }` },
      'consumer': { name: 'consumer', dependencies: { billing: '../shared-folder' }, model: consumerModel },
    })
    const locator = t.services.likec4.ModelLocator
    expect(locator.locateElement('@billing.svc' as Fqn, 'consumer' as ProjectId)?.uri).toBe(
      'file:///test/workspace/src/shared-folder/model.c4',
    )
    // in the context of another project, the name is the workspace project
    expect(locator.locateElement('@billing.svc' as Fqn, 'shared' as ProjectId)?.uri).toBe(
      'file:///test/workspace/src/billing/model.c4',
    )
  })

  it('does not fall back to the workspace project when the entry is not resolved', async ({ expect }) => {
    await using t = await workspace({
      'billing': { name: 'billing', model: `${spec} model { component svc }` },
      'consumer': { name: 'consumer', dependencies: { billing: '../missing' }, model: consumerModel },
    })
    const locator = t.services.likec4.ModelLocator
    expect(locator.locateElement('@billing.svc' as Fqn, 'consumer' as ProjectId)).toBeNull()
  })
})
