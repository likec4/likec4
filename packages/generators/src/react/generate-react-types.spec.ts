import { Builder } from '@likec4/core/builder'
import { describe, it } from 'vitest'
import { generateReactTypes } from './generate-react-types'

describe('generateReactTypes', () => {
  const m = Builder
    .specification({
      elements: {
        actor: {},
        system: {},
        component: {},
      },
      deployments: {
        env: {},
        vm: {},
      },
      relationships: {
        like: {},
        dislike: {},
      },
      tags: {
        tag1: {},
        tag2: {},
      },
      metadataKeys: ['key1', 'key2'],
    })
    .model(({ actor, system, component, relTo }, _) =>
      _(
        actor('alice'),
        actor('bob'),
        system('cloud').with(
          component('backend').with(
            component('api'),
            component('db', {
              tags: ['tag2'],
            }),
          ),
          component('frontend'),
        ),
      )
    )
    .deployment(({ env, vm, instanceOf }, _) =>
      _(
        env('prod').with(
          vm('vm1'),
          vm('vm2'),
        ),
        env('dev').with(
          vm('vm1'),
          instanceOf('cloud.backend.api'),
        ),
      )
    )
    // Test Element View
    .views(({ view, $include }, _) =>
      _(
        // rules inside
        view('view1', $include('cloud.backend')),
        view('view2', $include('cloud.*')),
      )
    )

  it('generate valid code', async ({ expect }) => {
    const aux = generateReactTypes(m.toLikeC4Model())
    await expect(aux).toMatchFileSnapshot('__snapshots__/valid-code.snap')
  })

  it('generate valid code with core package', async ({ expect }) => {
    const aux = generateReactTypes(m.toLikeC4Model(), { useCorePackage: true })
    await expect(aux).toMatchFileSnapshot('__snapshots__/valid-code-with-core.snap')
  })
})
