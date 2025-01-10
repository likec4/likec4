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

  const { $include, $exclude } = TestHelper

  describe('include', () => {
    describe('* -> *', () => {
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
          _.node('a.b.d.e').with(
            _.instanceOf('cloud.db'),
          ),
        )
      ))

      it('should include only instances and boundaries', () => {
        const state = t.processPredicates(
          $include('* -> *'),
        )
        t.expect(state).toHaveElements(
          'a.b.c.ui',
          'a.b.d.api',
          'a.b.d.e.db',
          'a.b.d',
        )
        t.expect(state).toHaveConnections(
          'a.b.c.ui -> a.b.d.api',
          'a.b.d.api -> a.b.d.e.db',
        )
      })

      it('* -> instance', () => {
        t.expectComputedView(
          $include('* -> a.b.d.api'),
        ).toHave(
          {
            nodes: [
              'a.b.c',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c -> a.b.d.api',
            ],
          },
        )
      })

      it('* -> instance where', () => {
        t.expectComputedView(
          $include('* -> a.b.d.api', { where: 'tag is #next' }),
        ).toHave(
          {
            nodes: [
              'a.b.c',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c -> a.b.d.api',
            ],
          },
        )

        t.expectComputedView(
          $include('* -> a.b.d.api', { where: 'tag is not #next' }),
        ).toHave(
          {
            nodes: [],
            edges: [],
          },
        )
      })

      it('* -> instance where participant is', () => {
        t.expectComputedView(
          $include('* -> a.b.d.api', { where: 'source.tag is #next' }),
        ).toHave(
          {
            nodes: [
              'a.b.c',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c -> a.b.d.api',
            ],
          },
        )
      })
    })

    describe('element -> *', () => {
      const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
        deploymentModel(
          _.node('a'),
          _.node('a.b1'),
          _.node('a.b1.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
          _.node('a.b2'),
          _.node('a.b2.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
        )
      ))

      it('node -> *', () => {
        t.expectComputedView(
          $include('a.b2.c -> *'),
        ).toHave({
          nodes: [],
          edges: [],
        })

        t.expect(t.computeView(
          $include('a.b2.c._ -> *'),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })

        t.expectComputedView(
          $include('a.b2.c <-> *'),
        ).toHave({
          nodes: [],
          edges: [],
        })
      })

      it('instance -> *', () => {
        const view1 = t.computeView(
          $include('a.b2.c.ui -> *'),
        )
        t.expect(view1).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })
      })

      it('node -> * where', () => {
        t.expect(t.computeView(
          $include('a.b2.c._ -> *', { where: 'tag is not #next' }),
        )).toHave({
          nodes: [],
          edges: [],
        })

        t.expect(t.computeView(
          $include('a.b2.c._ -> *', { where: 'tag is #next' }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })
      })

      it('node -> * where participant is', () => {
        t.expect(t.computeView(
          $include('a.b2.c._ -> *', {
            where: 'source.tag is #next',
          }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })

        t.expect(t.computeView(
          $include('a.b2.c._ -> *', {
            where: 'source.tag is not #next',
          }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })

      it('node -> node where', () => {
        t.expect(t.computeView(
          $include('a.b2.c._ -> a.b2.c._', { where: 'tag is not #next' }),
        )).toHave({
          nodes: [],
          edges: [],
        })

        t.expect(t.computeView(
          $include('a.b2.c._ -> a.b2.c._', { where: 'tag is #next' }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })
      })

      it('node -> instance where participant is', () => {
        t.expect(t.computeView(
          $include('a.b2.c._ -> a.b2.c.api', {
            where: 'source.tag is #next',
          }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })

        t.expect(t.computeView(
          $include('a.b2.c._ -> a.b2.c.api', {
            where: 'source.tag is not #next',
          }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })
  })

  describe('exclude', () => {
    describe('element -> *', () => {
      const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
        deploymentModel(
          _.node('a'),
          _.node('a.b1'),
          _.node('a.b1.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
          _.node('a.b2'),
          _.node('a.b2.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
        )
      ))

      it('node -> * where', () => {
        t.expect(t.computeView(
          $include('a.b2.c.ui -> *'),
          $exclude('a.b2.c._ -> *', {
            where: 'source.tag is #next',
          }),
        )).toHave({
          nodes: [],
          edges: [],
        })

        t.expect(t.computeView(
          $include('a.b2.c.ui -> *'),
          $exclude('a.b2.c._ -> *', {
            where: 'source.tag is not #next',
          }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })
      })
    })
  })
})
