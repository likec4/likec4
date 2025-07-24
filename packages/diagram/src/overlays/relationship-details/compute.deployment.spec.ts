import { Builder } from '@likec4/core/builder'
import { LikeC4Model } from '@likec4/core/model'
import { source } from 'motion/react-m'
import { title } from 'process'
import { describe, it } from 'vitest'
import { type RelationshipDetailsViewData, computeRelationshipDetailsViewData } from './compute.deployment'

describe('computeEdgeDetailsViewData', () => {
  const {
    builder: b,
    model: {
      model,
      el,
      rel,
    },
    deployment: {
      deployment,
      node,
      instanceOf,
      rel: drel,
    },
    views: {
      views,
      deploymentView,
      $include,
      $rules,
    },
  } = Builder.forSpecification({
    elements: {
      el: {},
    },
    deployments: {
      node: {},
    },
  })

  const baseModel = b
    .with(
      model(
        el('user'),
        el('system').with(
          el('frontends').with(
            el('web'),
            el('mobile'),
          ),
          el('backend'),
          el('db'),
        ),
        rel('user', 'system.frontends.web', 'uses'),
      ),
      deployment(
        node('prod').with(
          instanceOf('user'),
          node('dc1').with(
            node('frontend').with(
              node('web').with(
                instanceOf('web', 'system.frontends.web'),
              ),
            ),
            node('backend').with(
              instanceOf('backend', 'system.backend'),
              instanceOf('db', 'system.db'),
            ),
          ),
          node('dc2').with(
            node('frontend').with(
              node('web').with(
                instanceOf('web', 'system.frontends.web'),
              ),
            ),
            node('backend').with(
              instanceOf('backend', 'system.backend'),
              instanceOf('db', 'system.db'),
            ),
          ),
          drel('prod.dc1.backend.db', 'prod.dc2.backend.db', 'replicates'),
        ),
      ),
    )

  describe.only('deployment realtion', () => {
    const m = baseModel.clone()
      .with(views(
        deploymentView('prodView').with(
          $rules(
            $include('prod.*'),
          ),
        ),
      ))
      .build()

    const likec4Model = LikeC4Model.fromParsed(m)

    const viewData = simplify(computeRelationshipDetailsViewData({
      source: likec4Model.deployment.findElement('prod.dc1')!,
      target: likec4Model.deployment.findElement('prod.dc2')!,
    }))

    describe('adds node as source/target if', () => {
      it('it is the endpoint', ({ expect }) => {
        expect(viewData.sources).toContain('prod.dc1.backend.db')
        expect(viewData.targets).toContain('prod.dc2.backend.db')
      })
      // prod.dc*.backend is omited in result because it is the only child of prod.dc*.
      // See treeFromElements().flatten() for details
      it.skip('it is ancestor of the endpoint and is not shown on current view', ({ expect }) => {
        expect(viewData.sources).toContain('prod.dc1.backend')
        expect(viewData.targets).toContain('prod.dc2.backend')
      })
      it('it is ancestor of the endpoint and is a leaf node on current view', ({ expect }) => {
        expect(viewData.sources).toContain('prod.dc1')
        expect(viewData.targets).toContain('prod.dc2')
      })
    })
  })

  describe('model relation', () => {
    const m = baseModel.clone()
      .with(views(
        deploymentView('prodView').with(
          $rules(
            $include('prod.*'),
          ),
        ),
      ))
      .build()

    const likec4Model = LikeC4Model.fromParsed(m)

    const viewData = computeRelationshipDetailsViewData({
      source: likec4Model.deployment.findElement('prod.user')!,
      target: likec4Model.deployment.findElement('prod.dc1')!,
    })

    describe('adds node as source/target if', () => {
      it('it is an instance of the endpoint', ({ expect }) => {
        expect([...viewData.sources]).toContainEqual(expect.objectContaining({ id: 'prod.system1.system1' }))
        expect([...viewData.targets]).toContainEqual(expect.objectContaining({ id: 'prod.system2.system2' }))
        expect(viewData.relationships).toHaveLength(1)
        expect([...viewData.relationships]).toContainEqual(
          expect.objectContaining({
            source: expect.objectContaining({ id: 'prod.system1.system1' }),
            target: expect.objectContaining({ id: 'prod.system2.system2' }),
            title: 'uses',
          }),
        )
      })
      it('it is an instance of the endpoint\'s ancestor', ({ expect }) => {
      })
      it('it is a deployment node and ancestor of the instance of the endpoint and is not shown on current view', ({ expect }) => {
      })
      it('it is a deployment node and ancestor of the instance of the endpoint and is leaf node on current view', ({ expect }) => {
      })
    })
  })
})

function simplify(viewData: RelationshipDetailsViewData) {
  return {
    sources: [...viewData.sources].map(x => x.id),
    targets: [...viewData.sources].map(x => x.id),
    relationships: [...viewData.relationships].map(x => ({
      title: x.title,
      source: x.source.id,
      target: x.target.id,
    })),
  }
}
