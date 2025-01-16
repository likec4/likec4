import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('RelationPredicate', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        node: {},
      },
      tags: ['next', 'alpha'],
    })
    .model(({ el, rel }, _) =>
      _(
        el('client'),
        el('cloud'),
        el('cloud.ui', { tags: ['next'] }),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.db'),
        rel('client', 'cloud.ui'),
        rel('cloud.ui', 'cloud.backend.api', { tags: ['next'] }),
        rel('cloud.backend.api', 'cloud.db'),
      )
    )

  const { $include } = TestHelper

  describe('* -> * where participant is', () => {
    const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
      deploymentModel(
        _.node('a'),
        _.node('a.b'),
        _.node('a.b.c').with(
          _.instanceOf('cloud.ui'),
        ),
        _.node('a.b.d').with(
          _.instanceOf('api', 'cloud.backend.api', { tags: ['alpha'] }),
        ),
        _.node('a.b.d.e', { tags: ['alpha'] }).with(
          _.instanceOf('cloud.db'),
        ),
        _.rel('a.b.d.api', 'a.b.d.e'),
      )
    ))

    describe('model', () => {
      it('should exclude relation when porperties match', () => {
        // TODO: implementation of the $exclude helper for model ref required
      })

      it('should exclude relation when porperties do not match', () => {
        // TODO: implementation of the $exclude helper for model ref required
      })
    })

    describe('instance', () => {
      it('should include relation when model porperties match', () => {
        t.expectComputedView(
          $include('a.b.c.ui -> a.b.d.api', { where: 'source.tag is #next' }),
        ).toHave(
          {
            nodes: [
              'a.b.c.ui',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c.ui -> a.b.d.api',
            ],
          },
        )
      })

      it('should include relation when deployment porperties match', () => {
        t.expectComputedView(
          $include('a.b.c.ui -> a.b.d.api', { where: 'target.tag is #alpha' }),
        ).toHave(
          {
            nodes: [
              'a.b.c.ui',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c.ui -> a.b.d.api',
            ],
          },
        )
      })

      it('should not include relation when neither model nor deployment porperties match', () => {
        t.expectComputedView(
          $include('a.b.c.ui -> a.b.d.api', { where: 'source.tag is #alpha' }),
        ).toHave(
          {
            nodes: [],
            edges: [],
          },
        )
      })
    })

    describe('node', () => {
      it('should include relation when porperties match', () => {
        t.expectComputedView(
          $include('a.b.d.api -> a.b.d.e', { where: 'target.tag is #alpha' }),
        ).toHave(
          {
            nodes: [
              'a.b.d.api',
              'a.b.d.e',
            ],
            edges: [
              'a.b.d.api -> a.b.d.e',
            ],
          },
        )
      })

      it('should include relation when porperties do not match', () => {
        t.expectComputedView(
          $include('a.b.d.api -> a.b.d.e', { where: 'target.tag is #next' }),
        ).toHave(
          {
            nodes: [],
            edges: [],
          },
        )
      })
    })
  })
})
