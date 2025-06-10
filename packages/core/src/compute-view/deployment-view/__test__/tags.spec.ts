import { describe, it } from 'vitest'
import { Builder } from '../../../builder/Builder'
import { TestHelper } from './TestHelper'

describe('Deployment view: node tags', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        nd: {},
        vm: {
          tags: ['tag1'],
        },
      },
      tags: {
        tag1: {},
        tag2: {},
      },
    })
    .deployment(({ nd, vm }, _) =>
      _(
        nd('nd').with(
          vm('vm1', { tags: ['tag2'] }),
          vm('vm2'),
        ),
      )
    )

  const { $include } = TestHelper

  it('inherit tags', ({ expect }) => {
    const t = TestHelper.from(builder, expect)
    const view = t.computeView(
      $include('nd.vm1'),
      $include('nd.vm2'),
    )
    t.expect(view).toHaveNodes('nd.vm1', 'nd.vm2')
    expect(view.nodes.find(n => n.id === 'nd.vm1')?.tags).toEqual(['tag2', 'tag1'])
    expect(view.nodes.find(n => n.id === 'nd.vm2')?.tags).toEqual(['tag1'])
  })
})
